import { Request, Response } from "express";
import { CommentRepository, ReactionHelper, PostRepository, BlockedUserRepository } from "../../DB";
import {
  BadRequestError,
  CommentDeletedBy,
  ForbiddenError,
  formatCommentAttachment,
  formatUser,
  getReactionsSummary,
  IComment,
  IPost,
  NotFoundError,
  Reactions,
  UnauthorizedError,
} from "../../utils";
import { ICreateCommentDto } from "./comment.dto";
import { CommentFactory } from "./factory";
import cloudinary from './../../config/cloudinary/index';
import fs from "fs/promises";

class CommentService {
  constructor() {}
  private readonly postRepository = new PostRepository();
  private readonly commentRepository = new CommentRepository();
  private readonly commentFactoryService = new CommentFactory();
  private readonly blockedUserRepository = new BlockedUserRepository();
  private readonly reactionHelper = new ReactionHelper();

  public createComment = async (req: Request, res: Response) => {
    try {
      const { content, mentions } = req.body;
      const { postId, commentId } = req.params;
      const file = req.file as Express.Multer.File | undefined;

      // ✅ Validation checks
      if (!file && (!content || content.trim().length === 0)) {
        throw new BadRequestError("Comment must contain text or image.");
      }
      if (!postId && !commentId) {
        throw new NotFoundError("You must provide either postId or commentId");
      }

      // ✅ Double check post & comment existence
      let postExists: IPost | null = null;
      let commentExists: IComment | null = null;

      if (postId) {
        postExists = await this.postRepository.findOne({
          _id: postId,
          isDeleted: false,
        });
        if (!postExists) throw new NotFoundError("Post not found or deleted");
      }

      if (commentId) {
        commentExists = await this.commentRepository.findOne({
          _id: commentId,
          isDeleted: false,
        });
        if (!commentExists) throw new NotFoundError("Parent comment not found");
      }

      // ✅ Determine the postId (even if it's a reply)
      const targetPostId = postExists?._id || commentExists?.postId;
      if (!targetPostId) throw new NotFoundError("Cannot determine post for this comment");

      // ☁️ Upload image to Cloudinary (if exists)
      let attachment: { secure_url: string; public_id: string } | null = null;

      if (file) {
        if (!file.mimetype.startsWith("image/")) {
          await fs.unlink(file.path).catch(() => null);
          throw new BadRequestError("Only image files are allowed for comments.");
        }

        const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, {
          folder: `social-media/users/${req.user._id}/uploads/comments`,
          resource_type: "image",
          transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
        });

        attachment = { secure_url, public_id };

        // 🧹 Delete file after upload
        await fs.unlink(file.path).catch(() => null);
      }

      // 🧱 Prepare DTO
      const dto: ICreateCommentDto = {
        content: content ? content.trim() : "",
        attachment,
        mentions: mentions ? JSON.parse(mentions) : [],
      };

      // 🏗️ Prepare entity class
      const comment = this.commentFactoryService.createComment(
        dto,
        req.user._id,
        targetPostId,
        commentExists?._id || null
      );

      // 💾 Create comment
      const commentCreated = await this.commentRepository.create(comment);
      const newComment = commentCreated.toJSON() as IComment;
      // 🔁 if it's a reply, update parent comment counters
      if (commentExists) {
        await this.commentRepository.update(
          { _id: commentExists._id },
          {
            $inc: { repliesCount: 1 },
            $set: { hasReplies: true },
          }
        );
      }

      return res.status(201).json({
        success: true,
        message: "Comment created successfully",
        data: {
          _id: newComment?._id,
          user: formatUser(req.user),
          content: newComment?.content,
          mentions: newComment?.mentions,
          attachment: formatCommentAttachment(newComment?.attachment),
          createdAt: newComment?.createdAt,
        },
      });
    } catch (error) {
      if (req.file && req.file.path) {
        await fs.unlink(req.file.path).catch(() => null);
      }
      throw error;
    }
  };

  public getCommentReplies = async (req: Request, res: Response) => {
    const { commentId } = req.params as { commentId: string };
    const page = Math.max(Math.abs(Number(req.query.page)) || 1, 1);
    const limit = Math.min( Math.max(Math.abs(Number(req.query.limit)) || 10, 1), 30 );

    const parentComment = await this.commentRepository.findOne({
      _id: commentId,
      isDeleted: false,
    });
    if (!parentComment) throw new NotFoundError("Comment not found");

    if (!parentComment.hasReplies) {
      return res.status(200).json({
        success: true,
        message: "No replies found",
        data: [],
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalReplies: 0,
        },
      });
    }

    const replies = await this.commentRepository.find(
      { parentId: commentId, isDeleted: false },
      { updatedAt: 0, __v: 0, isDeleted: 0, deletedAt: 0, deletedBy: 0, parentId: 0, postId: 0 },
      {
        sort: { createdAt: -1 },
        skip: (page - 1) * limit,
        limit,
        populate: [
          {
            path: "userId",
            select: "firstName lastName profilePicture",
          },
        ],
      }
    );

    const totalReplies = await this.commentRepository.countComments({
      parentId: commentId,
      isDeleted: false,
    });

    const formattedReplies = replies.map((r) => {
      const obj = r.toObject(); 
      return {
        ...obj,
        user: formatUser(obj.userId),
        attachment: formatCommentAttachment(obj.attachment),
        reactionsSummary: getReactionsSummary(obj.reactions),
        reactions: undefined,
        userId: undefined,
        _id: undefined,
      }
    });

    return res.status(200).json({
      success: true,
      message: "Replies retrieved successfully",
      data: formattedReplies,
      meta: {
        page,
        pageSize: limit,
        totalReplies,
        hasNext: totalReplies > page * limit,
      },
    });
  };

  public reaction = async (req: Request, res: Response) => {
    const { reaction }: { reaction?: Reactions } = req.body;
    const { commentId } = req.params as { commentId: string };
    const comment = await this.commentRepository.findOne({ _id: commentId });
    if (!comment) throw new NotFoundError("Comment not found");
    // ✅ 2. Check if user own post in block list
    const isBlocked = await this.blockedUserRepository.exists({
      $or: [
        { blockerId: req.user._id, blockedId: comment.userId }, 
        { blockerId: comment.userId, blockedId: req.user._id }
      ]
    });
    
    if (isBlocked) {
      throw new ForbiddenError("You cannot react to a comment of a blocked user");
    }
    const { action } = await this.reactionHelper.handleReactions(
      this.commentRepository,
      commentId,
      req.user._id,
      reaction,
      { type: "comment" }
    );

    return res.status(200).json({
      success: true,
      message: action,
    });
  };

  public getCommentReactions = async (req: Request, res: Response) => {
    const { commentId } = req.params as { commentId: string };
    const page = Math.max(Math.abs(Number(req.query.page)) || 1, 1);
    const limit = Math.min(Math.max((Math.abs(Number(req.query.limit)) || 20), 1), 40); // default 20, max 40

    const comment = await this.commentRepository.findOne(
      { _id: commentId, isDeleted: false },
      { reactionsSummary: 1, reactions: 1 },
      {
        populate: { path: "reactions.userId", select: "firstName lastName profilePicture" },
      }
    );
    if (!comment) {
      throw new NotFoundError("Comment not found or deleted");
    }

    const allReactions = Array.isArray(comment.reactions) ? comment.reactions : [];

    const start = (page - 1) * limit;
    const pagedReactions = allReactions.slice(start, start + limit);
      
    const formattedReactions = pagedReactions.map((r: any) => {
      const reactionObj = r.toObject ? r.toObject() : r;
      return {
        reaction: reactionObj.reaction,
        user: formatUser(reactionObj.userId),
      };
    });
    
    return res.status(200).json({
      success: true,
      message: "Reactions retrieved successfully",
      data: formattedReactions,
      meta: {
        currentPage: page,
        pageSize: limit,
        total: allReactions.length,
        hasNext: allReactions.length > start + limit,
      }
    });
  };

  public updateComment = async (req: Request, res: Response) => {
    const { commentId } = req.params as { commentId: string };
    const { content, removeAttachment } = req.body;
    const file = req.file as Express.Multer.File | undefined;

    // 🟢 Get the comment
    const comment = await this.commentRepository.findOne({ _id: commentId, isDeleted: false }, {}, { lean: true });
    if (!comment) throw new NotFoundError("Comment not found");

    // 🔒 Check permission
    if (String(comment.userId) !== String(req.user._id) && req.user.role !== "admin") {
      throw new UnauthorizedError("Unauthorized to update this comment");
    }

    const updateData: any = {};

    // 📝 Update content
    if (content !== undefined) updateData.content = content || null;

    // 👥 Parse and update mentions safely
    let parsedMentions: string[] | undefined;
    if (req.body.mentions !== undefined) {
      try {
        parsedMentions = Array.isArray(req.body.mentions)
          ? req.body.mentions
          : JSON.parse(req.body.mentions);

        if (!Array.isArray(parsedMentions)) parsedMentions = [];
      } catch {
        parsedMentions = [];
      }
    }

    if (parsedMentions !== undefined) {
      updateData.mentions = parsedMentions;
    }

    // 📸 Handle new image upload
    let attachment: { secure_url: string; public_id: string } | null = null;
    if (file) {
      if (!file.mimetype.startsWith("image/")) {
        await fs.unlink(file.path).catch(() => null);
        throw new BadRequestError("Only image files are allowed for comments.");
      }

      const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, {
        folder: `social-media/users/${req.user._id}/uploads/comments`,
        resource_type: "image",
        transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
      });

      attachment = { secure_url, public_id };
      await fs.unlink(file.path).catch(() => null);
    }

    // 🗑️ Remove old image if requested
    if (removeAttachment == "true") {
      if (comment.attachment?.public_id) {
        await cloudinary.uploader.destroy(comment.attachment.public_id);
      }
      updateData.attachment = null;
    } else if (attachment) {
      updateData.attachment = attachment;
    }

    // 🚫 Nothing to update
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestError("Nothing to update");
    }

    // ✅ Update in DB
    const updatedComment = await this.commentRepository.findAndUpdate(
      { _id: commentId, isDeleted: false },
      { $set: updateData },
      {
        new: true,
        populate: { path: "userId", select: "fullName firstName lastName profilePicture" },
        lean: true,
      }
    );

    // 📤 Response
    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: {
        id: updatedComment?._id,
        user: formatUser(updatedComment?.userId),
        content: updatedComment?.content,
        mentions: updatedComment?.mentions,
        attachment: formatCommentAttachment(updatedComment?.attachment as any),
        hasReplies: updatedComment?.hasReplies,
        repliesCount: updatedComment?.repliesCount,
        createdAt: updatedComment?.createdAt,
        updatedAt: updatedComment?.updatedAt,
      },
    });
  };

  public softDeleteComment = async (req: Request, res: Response) => {
    const { commentId } = req.params as { commentId: string };

    const comment = await this.commentRepository.findOne(
      { _id: commentId, isDeleted: false },
      {},
      { populate: { path: "postId", select: "userId" }, lean: true }
    );

    if (!comment) throw new NotFoundError("Comment not found or already deleted");

    // 🚫 Authorization check (Own Comment | Own Post | Admin)
    if (
      ![
        String(comment.userId),
        String((comment.postId as unknown as IPost).userId),
      ].includes(String(req.user._id)) &&
      req.user.role !== "admin"
    ) {
      throw new UnauthorizedError("Unauthorized to delete this comment");
    }

    // 🧠 Determine who deleted the comment
    let deletedBy = CommentDeletedBy.USER;
    if (String((comment.postId as unknown as IPost).userId) === String(req.user._id)) {
      deletedBy = CommentDeletedBy.POST_OWNER;
    }
    if (req.user.role === "admin") {
      deletedBy = CommentDeletedBy.ADMIN;
    }

    // 🧾 Update parent comment
    if (comment.parentId) {
      const parentComment = await this.commentRepository.findAndUpdate(
        { _id: comment.parentId, isDeleted: false },
        { $inc: { repliesCount: -1 } },
        { new: true }
      );

      if (parentComment && parentComment.repliesCount <= 0) {
        await this.commentRepository.update(
          { _id: parentComment._id },
          { $set: { hasReplies: false } }
        );
      }
    }

    // 🧩 Collect all replies recursively
    const toDeleteIds: string[] = [commentId];
    const queue: string[] = [commentId];

    while (queue.length > 0) {
      const parentId = queue.pop();
      const replies = await this.commentRepository.find(
        { parentId, isDeleted: false },
        { _id: 1 },
        { lean: true }
      );

      if (replies.length > 0) {
        const replyIds = replies.map((r) => String(r._id));
        toDeleteIds.push(...replyIds);
        queue.push(...replyIds);
      }
    }

    // 🫥 Soft delete all comments & replies
    await this.commentRepository.updateMany(
      { _id: { $in: toDeleteIds } },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "🫥 Comment and all related replies deleted successfully",
      deletedCount: toDeleteIds.length,
    });
  };
}

export default new CommentService();
