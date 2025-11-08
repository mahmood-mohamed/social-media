import { Request, Response } from "express";
import { BlockedUserRepository, CommentRepository, PostRepository, ReactionHelper } from "../../DB";
import { ICreatePostDto } from "./post.dto";
import { PostFactoryService } from "./factory";
import { BadRequestError, CommentDeletedBy, ForbiddenError, formatCommentAttachment, formatPostAttachments, formatUser, generateFileHash, getReactionsSummary, IAttachment, NotFoundError, PostDeletedBy, UnauthorizedError } from "../../utils";
import { ObjectId } from "mongoose";
import cloudinary from "../../config/cloudinary";
import fs from "fs/promises";

class PostService {
  private readonly postRepository = new PostRepository();
  private readonly postFactoryService = new PostFactoryService();
  private readonly commentRepository = new CommentRepository();
  private readonly blockedUserRepository = new BlockedUserRepository
  private readonly reactionHelper = new ReactionHelper();
  constructor() {}

  createPost = async (req: Request, res: Response) => {
    const { content, mentions } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;

    try {
      // ✅ Validation checks 👇
      if ((!content || !content.trim()) && (!files || files.length === 0)) {
        throw new BadRequestError("Post must contain text or media.");
      }
      // =====================================================
      // 🖼️ Upload files to Cloudinary + hash generation
      // =====================================================
      let attachments: IAttachment[] = [];
      if (files && files.length > 0) {
        const uploadResults = await Promise.all(
          files.map(async (file) => {
            try {
              // 🧮 Generate hash before upload
              const { secure_url, public_id, resource_type } =
                await cloudinary.uploader.upload(file.path, {
                  folder: `social-media/users/${req.user._id}/uploads/posts`,
                  resource_type: "auto",
                  transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
                });

              // ✅ Delete local temp file
              await fs.unlink(file.path).catch(() => null);

              return {
                secure_url,
                public_id,
                type: resource_type === "video" ? "video" : "image",
              };
            } catch (err) {
              await fs.unlink(file.path).catch(() => null);
              throw new BadRequestError(`Failed to upload file: ${file.originalname}`);
            }
          })
        );
        attachments = uploadResults;
      }
      // =====================================================
      // 🧱 Prepare DTO
      // =====================================================
      const dto: ICreatePostDto = {
        content: content?.trim() || "",
        attachments,
        mentions: mentions ? JSON.parse(mentions) : [],
      };
      // =====================================================
      // 🏭 Use Factory → Entity → Repository
      // =====================================================
      const post = this.postFactoryService.createPost(dto, req.user._id);
      const createdPost = await this.postRepository.create(post);
      const result = createdPost.toObject();
      // =====================================================
      // ✅ Send Response
      // =====================================================
      return res.status(201).json({
        success: true,
        message: "Post created successfully",
        data: {
          _id: result._id,
          userId: result.userId,
          content: result.content,
          mentions: result.mentions,
          attachments: formatPostAttachments(result.attachments),
          createdAt: result.createdAt, 
        }
      });
    } catch (error) {
      // 🧹 Cleanup local files if any remain
      if (files && files.length > 0) {
        await Promise.all(files.map((f) => fs.unlink(f.path).catch(() => null)));
      }

      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Something went wrong",
      });
    }
  };

  updatePost = async (req: Request, res: Response) => {
    const { postId } = req.params as { postId: string };
    let { content, mentions } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;
    
    // ✅ Check if mentions field exists in request
    const hasMentionsField = Object.prototype.hasOwnProperty.call(req.body, "mentions");
    if(hasMentionsField){
      try {
        if (typeof mentions === "string") mentions = JSON.parse(mentions);
      } catch {
        mentions = [];
      }
      mentions = Array.isArray(mentions) ? mentions : [];
    }
       
    // ✅ 1. Fetch existing post
    const existingPost = await this.postRepository.findOne({
      _id: postId,
      isDeleted: false,
    });
    if (!existingPost) throw new NotFoundError("Post not found or deleted");
    // 🚫 Authorization check (Own post | Admin)
    if (String(existingPost.userId) !== String(req.user._id) && req.user.role !== "admin") {
      throw new UnauthorizedError("Unauthorized to update this post");
    }

    // ✅ 2. Upload all new attachments (if any)
    let newAttachments: IAttachment[] = [];
    let shouldReplaceAttachments = false;

    if (files && Array.isArray(files) && files.length > 0) {
      shouldReplaceAttachments = true;
      if (files.length > 0){
        const uploaded = await Promise.all(
          files.map(async (file: any) => {
            // ارفع الملف سواء كان صورة أو فيديو
            const localPath = file.localPath || file.path || file.secure_url;
            if (!localPath) return null;
            
            const { secure_url, public_id, resource_type } =
              await cloudinary.uploader.upload(localPath, {
                folder: `social-media/users/${req.user._id}/uploads/posts`,
                resource_type: "auto",
                transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
              });
              await fs.unlink(localPath).catch(() => null);
              return {
                secure_url,
                public_id,
                type: resource_type === "video" ? "video" : "image",
              };
            })
          );
          // ⛏️ filter nulls
          newAttachments = uploaded.filter(Boolean) as IAttachment[];
      }else{
        newAttachments = []; // remove all old attachments
      }
    }
    
    // ✅ 3. Prepare updated fields
    const updateData: Record<string, any> = {};
    if(content !== undefined){
      updateData.content = content?.trim() 
    }else{
      updateData.content = existingPost.content;
    }
  
    if(hasMentionsField){
      updateData.mentions = mentions;
    }else{
      updateData.mentions = existingPost.mentions;
    }
    // ✅ 4. Replace attachments only if new ones were uploaded
    if(shouldReplaceAttachments){
      if (existingPost.attachments?.length > 0) {
        await Promise.allSettled(
          existingPost.attachments.map((a) =>
            cloudinary.uploader.destroy(a.public_id).catch(() => null)
          )
        );
      }
      updateData.attachments = newAttachments;
    }else{
      updateData.attachments = existingPost.attachments;
    }

    // ✅ 5. Update post in DB
    const updatedPost = await this.postRepository.findAndUpdate(
      { _id: postId },
      updateData,
      { new: true, lean: true }
    );

    // ✅ 6. Done
    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: {
        _id: updatedPost?._id,
        userId: updatedPost?.userId,
        content: updatedPost?.content,
        mentions: updatedPost?.mentions,
        attachments: formatPostAttachments(updatedPost?.attachments || []),
        createdAt: updatedPost?.createdAt,
      },
    });
  };

  getSpecificPost = async (req: Request, res: Response) => {
    const { postId } = req.params as { postId: string };
    const previewLimit = 3;

    const post = await this.postRepository.findOne(
      { _id: postId, isDeleted: false },
      { updatedAt: 0, __v: 0 },
      {
        populate: [
          { path: "userId", select: "firstName lastName profilePicture" },
          {
            path: "reactions.userId",
            select: "firstName lastName profilePictureUrl",
          },
          {
            path: "comments",
            match: { 
              parentId: null, 
              $or: [{ isDeleted: false } , { isDeleted: true, hasReplies: true }] 
            },
            options: { sort: { createdAt: -1 }, limit: previewLimit },
            populate: {
              path: "userId",
              select: "firstName lastName profilePicture",
            },
          },
        ],
        lean: true,
      }
    );

    if (!post) throw new NotFoundError("Post not found");

    // ✅ Parallel counts (comments)
    const [totalFirstLevelComments, totalAllComments] = await Promise.all([
      this.commentRepository.countComments({
        postId,
        parentId: null,
        $or: [{ isDeleted: false }, { isDeleted: true, hasReplies: true }],
      }),
      this.commentRepository.countComments({ postId, $or: [{ isDeleted: false }, { isDeleted: true, hasReplies: true }] }),
    ]);

    //*✅ Reaction summary for the post itself
    const postReactionsSummary = getReactionsSummary(post.reactions);

    //*✅ clean preview comments
    const previewComments = (post.comments || []).map((c: any) => {
      // ✅ Get reactions summary for each comment ®️
      const reactionsSummary = getReactionsSummary(c.reactions);
      return {
        _id: c._id,
        user: formatUser(c.userId),
        content: c.content,
        mentions: c.mentions,
        attachment: formatCommentAttachment(c.attachment),
        reactionsSummary,
        createdAt: c.createdAt,
        isDeleted: c.isDeleted,
        hasReplies: c.hasReplies,
      }
    });
    //*✅ Final response
    return res.status(200).json({
      success: true,
      message: "Post retrieved successfully",
      data: {
        _id: post._id,
        user: formatUser(post.userId),
        content: post.content,
        mentions: post.mentions || [],
        attachments: formatPostAttachments(post.attachments),
        previewComments: previewComments,
      },
      meta: {
        postReactionsSummary,
        totalFirstLevelComments,
        totalAllComments,
      }
    });
  };

  getPostComments = async (req: Request, res: Response) => {
    const { postId } = req.params as { postId: string };
    const page = Math.max(Math.abs(Number(req.query.page)) || 1, 1);
    const limit = Math.min(Math.max((Math.abs(Number(req.query.limit)) || 10), 1), 30);

    const postExists = await this.postRepository.findOne({ _id: postId, isDeleted: false });
    if (!postExists) throw new NotFoundError("Post not found");
    
    const [comments, totalComments] = await Promise.all([
      this.commentRepository.find(
        { postId, parentId: null, $or: [{ isDeleted: false }, { isDeleted: true, hasReplies: true }] },
        { createdAt: 0, updatedAt: 0, __v: 0, deletedAt: 0, deletedBy: 0, parentId: 0, postId: 0 },
        {
          sort: { createdAt: -1 },
          skip: (page - 1) * limit,
          limit,
          populate: [
            { path: "userId", select: "firstName lastName profilePicture" },
          ],
          lean: true
        }
      ),
    
      this.commentRepository.countComments({
        postId,
        parentId: null,
        $or: [{ isDeleted: false }, { isDeleted: true, hasReplies: true }]
      })
    ]);

    if (!comments) {
      throw new NotFoundError("Comments not found");
    }

    const cleanComments = comments.map((comment) => {
      const attachment = formatCommentAttachment(comment.attachment);
      const reactionsSummary = getReactionsSummary(comment.reactions);
      return {
        ...comment,
        userId: formatUser(comment.userId),
        attachment,
        reactionsSummary,
        reactions: undefined,
      }
    });

    return res.status(200).json({
      success: true,
      message: "Comments retrieved successfully",
      data: cleanComments,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalComments,
        nextPage: page * limit < totalComments ? page + 1 : undefined,
      }
    });
  };

  reaction = async (req: Request, res: Response) => {
    const { postId } = req.params as { postId: string };
    const { reaction } = req.body;
    const userId = req.user._id as ObjectId;

    // ✅ 1. Get post once
    const post = await this.postRepository.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      throw new NotFoundError("Post not found or deleted");
    }
    // ✅ 2. Check if user own post in block list
    const isBlocked = await this.blockedUserRepository.exists({
      $or: [
        { blockerId: userId, blockedId: post.userId }, 
        { blockerId: post.userId, blockedId: userId }
      ]
    });
    if (isBlocked) {
      throw new ForbiddenError("You cannot react to a post of a blocked user");
    }
    // ✅ 3. Pass the existing post to repository (no need to re-fetch)
    const { action } = await this.reactionHelper.handleReactions(
      this.postRepository,
      postId,
      userId,
      reaction,
      { type: "post" }
    );

    return res.status(200).json({
      success: true,
      message: action,
    });
  };

  getPostReactions = async (req: Request, res: Response) => {
    const { postId } = req.params as { postId: string };
    const page = Math.max(Math.abs(Number(req.query.page)) || 1, 1);
    const limit = Math.min(Math.max((Math.abs(Number(req.query.limit)) || 20), 1), 40); // max 40, default 20

    // ✅ 1. Get post once
    const post = await this.postRepository.findOne(
      { _id: postId, isDeleted: false },
      { reactionsSummary: 1, reactions: 1 },
      {
        populate: { path: "reactions.userId", select: "firstName lastName profilePicture" },
      }
    );
    if (!post) {
      throw new NotFoundError("Post not found or deleted");
    }

    const allReactions = Array.isArray(post.reactions) ? post.reactions : [];

    const start = (page - 1) * limit;
    const paged = allReactions.slice(start, start + limit);
    const formattedReactions = paged.map((r: any) => {
      const reactionObj = r.toObject ? r.toObject() : r;
      // if r.userId is populated object, keep it, else keep r.userId
      return {
        reaction: reactionObj.reaction,
        user: formatUser(reactionObj.userId),
      }
    });
    return res.status(200).json({
      success: true,
      message: "Reactions retrieved successfully",
      data: formattedReactions,
      pagination: {
        currentPage: page,
        pageSize: limit,
        total: allReactions.length,
        hasNext: allReactions.length > start + limit,
      }
    });
  };

  softDeletePost = async (req: Request, res: Response) => {
    const { postId } = req.params;
    const postExists = await this.postRepository.exists({ _id: postId, isDeleted: false });    
    if (!postExists) {
      throw new NotFoundError("Post not found or already deleted");
    }
    const query = 
      req.user.role === "admin" 
        ? { _id: postId }
        : { _id: postId, userId: req.user._id }; 

    const deletedBy = 
      req.user.role === "admin"
        ? PostDeletedBy.ADMIN
        : PostDeletedBy.USER;

    const post = await this.postRepository.findAndUpdate(
      query,
      { $set: { 
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy
        } 
      },
      { lean: true, new: true }
    );
    if (!post) {
      throw new NotFoundError(
        "Post not found or you're not authorized to delete this post"
      );
    }
    // 🧹 Cascade delete comments related to this post
    await this.commentRepository.updateMany(
      { postId: post._id }, 
      { $set: { isDeleted: true, deletedBy: CommentDeletedBy.POST, deletedAt: new Date() } },
    );
    return res.status(200).json({
      success: true,
      message: 
        req.user.role === "admin"
        ? "🗑️ Post soft deleted by admin successfully"
        : "📥 Post deleted successfully",
    });
  };
}

export default new PostService();
