import { NextFunction, Request, Response } from "express";
import { BlockedUserRepository, CommentRepository, FriendshipRepository, PostRepository, ReactionHelper } from "../../DB";
import { ICreatePostDto } from "./post.dto";
import { PostFactoryService } from "./factory";
import { BadRequestError, CommentDeletedBy, ForbiddenError, formatCommentAttachment, formatPostAttachments, formatUser, getReactionsSummary, getUserRelations, IAttachment, IPost, NotFoundError, PostDeletedBy, PostPrivacy, sendMentionEmails, UnauthorizedError, validateBlockRelation, validatePostPrivacy } from "../../utils";
import { ObjectId } from "mongoose";
import cloudinary from "../../config/cloudinary";
import fs from "fs/promises";

class PostService {
  private readonly postRepository = new PostRepository();
  private readonly postFactoryService = new PostFactoryService();
  private readonly commentRepository = new CommentRepository();
  private readonly blockedUserRepository = new BlockedUserRepository();
  private readonly friendRepository = new FriendshipRepository();
  private readonly reactionHelper = new ReactionHelper();
  constructor() { }

  getFeed = async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;

    // Get Friends & Blocked Users
    const { friendIds, blockedIds } = await getUserRelations({
      userId: req.user._id,
      friendRepository: this.friendRepository,
      blockedUserRepository: this.blockedUserRepository,
    });

    // Feed Filter
    const filter = {
      isDeleted: false,

      userId: {
        $nin: blockedIds,
      },

      $or: [
        // My Posts
        {
          userId: req.user._id,
        },
        // Public Posts
        {
          privacy: PostPrivacy.PUBLIC,
        },
        // Friends Posts
        {
          userId: {
            $in: friendIds,
          },
          privacy: PostPrivacy.FRIENDS,
        },
      ],
    };

    // Get Posts + Count
    const [posts, total] = await Promise.all([
      this.postRepository.find(
        filter,
        { __v: 0, updatedAt: 0 },
        {
          sort: { createdAt: -1 },
          skip,
          limit,
          lean: true,
          populate: [
            {
              path: "userId",
              select: "firstName lastName profilePicture",
            },
          ],
        }
      ),
      this.postRepository.countDocuments(filter),
    ]);

    // Comment Counts
    const postsWithMeta = await Promise.all(
      posts.map(async (post: any) => {
        const totalComments = await this.commentRepository.countComments({
          postId: post._id,
          $or: [
            {
              isDeleted: false,
            },
            {
              isDeleted: true,
              hasReplies: true,
            },
          ],
        });

        return {
          _id: post._id,
          user: formatUser(post.userId),
          content: post.content,
          mentions: post.mentions ?? [],
          attachments: formatPostAttachments(post.attachments),
          privacy: post.privacy,
          reactionsSummary: getReactionsSummary(post.reactions),
          totalComments,
          createdAt: post.createdAt,
        };
      })
    );

    // Response
    return res.status(200).json({
      success: true,
      message: "Feed retrieved successfully.",
      data: postsWithMeta,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    });
  };

  getUserPosts = async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string };
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;

    // Check Block
    await validateBlockRelation({
      currentUserId: req.user._id,
      targetUserId: userId,
      blockRepository: this.blockedUserRepository,
    });

    // Determine visible privacy
    let privacyFilter: any[] = [PostPrivacy.PUBLIC];

    if (req.user._id.toString() === userId) {
      privacyFilter = [
        PostPrivacy.PUBLIC,
        PostPrivacy.FRIENDS,
        PostPrivacy.ONLY_ME,
      ];
    } else {
      const isFriend = await this.friendRepository.exists({
        userId,
        friendId: req.user._id,
      });

      if (isFriend) {
        privacyFilter.push(PostPrivacy.FRIENDS);
      }
    }

    const filter = {
      userId,
      isDeleted: false,
      privacy: {
        $in: privacyFilter,
      },
    };

    const [posts, total] = await Promise.all([
      this.postRepository.find(
        filter,
        { __v: 0, updatedAt: 0 },
        {
          sort: { createdAt: -1 },
          skip,
          limit,
          lean: true,
          populate: [
            {
              path: "userId",
              select: "firstName lastName profilePicture",
            },
          ],
        }
      ),
      this.postRepository.countDocuments(filter),
    ]);

    const data = await Promise.all(
      posts.map(async (post: any) => ({
        _id: post._id,
        user: formatUser(post.userId),
        content: post.content,
        mentions: post.mentions ?? [],
        attachments: formatPostAttachments(post.attachments),
        privacy: post.privacy,
        reactionsSummary: getReactionsSummary(post.reactions),
        totalComments: await this.commentRepository.countComments({
          postId: post._id,
          $or: [
            { isDeleted: false },
            { isDeleted: true, hasReplies: true },
          ],
        }),
        createdAt: post.createdAt,
      }))
    );

    return res.status(200).json({
      success: true,
      message: "User posts retrieved successfully.",
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    });
  };

  createPost = async (req: Request, res: Response, next: NextFunction) => {
    const { content, mentions, privacy } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;

    try {
      // ✅ Validation checks 👇
      if ((!content || !content.trim()) && (!files || files.length === 0)) {
        throw new BadRequestError("Post must contain text or media.");
      }
      if (privacy && !Object.values(PostPrivacy).includes(privacy)) {
        throw new BadRequestError("Invalid privacy value");
      }
      // 🖼️ Upload files to Cloudinary + hash generation
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
      // 🧱 Prepare DTO
      const dto: ICreatePostDto = {
        content: content?.trim() || "",
        attachments,
        mentions: mentions ?? [],
        privacy: privacy,
      };
      // 🏭 Use Factory → Entity → Repository
      const post = this.postFactoryService.createPost(dto, req.user._id);
      const createdPost = await this.postRepository.create(post);
      const result = createdPost.toObject();

      // ===  Send Mention Email ===
      if (req.mentionedUsers?.length) {
        void sendMentionEmails({
          users: req.mentionedUsers,
          sender: req.user,
          entityType: "post",
          postId: result._id.toString(),
          content: result.content,
        })
          .catch((err) => {
            console.error(err);
          });
      }

      // ✅ Send Response
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
          privacy: result.privacy,
        }
      });
    } catch (error) {
      // 🧹 Cleanup local files if any remain
      if (files && files.length > 0) {
        await Promise.all(files.map((f) => fs.unlink(f.path).catch(() => null)));
      }

      next(error);
    }
  };

  updatePost = async (req: Request, res: Response) => {
    const { postId } = req.params as { postId: string };
    let { content, mentions, privacy, removeAttachments } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;

    // Parse mentions
    const hasMentionsField = Object.prototype.hasOwnProperty.call(
      req.body,
      "mentions"
    );

    removeAttachments = removeAttachments === "true";

    // Validate privacy
    if (
      privacy !== undefined &&
      !Object.values(PostPrivacy).includes(privacy)
    ) {
      throw new BadRequestError("Invalid privacy value");
    }

    // Find post
    const existingPost = await this.postRepository.findOne({
      _id: postId,
      isDeleted: false,
    });

    if (!existingPost) {
      throw new NotFoundError("Post not found");
    }

    if (
      existingPost.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      throw new UnauthorizedError(
        "Unauthorized to update this post"
      );
    }

    // Upload new attachments
    let newAttachments: IAttachment[] = [];
    let shouldReplaceAttachments = false;

    // remove old attachments
    if (removeAttachments) {
      shouldReplaceAttachments = true;
      newAttachments = [];
    }

    // upload new attachments
    if (files?.length) {
      shouldReplaceAttachments = true;

      const uploaded = await Promise.all(
        files.map(async (file) => {
          try {
            const { secure_url, public_id, resource_type } =
              await cloudinary.uploader.upload(file.path, {
                folder: `social-media/users/${req.user._id}/uploads/posts`,
                resource_type: "auto",
                transformation: [
                  { quality: "auto" },
                  { fetch_format: "auto" },
                ],
              });

            await fs.unlink(file.path).catch(() => null);

            return {
              secure_url,
              public_id,
              type: resource_type === "video" ? "video" : "image",
            };
          } catch (error) {
            await fs.unlink(file.path).catch(() => null);
            throw error;
          }
        })
      );

      newAttachments = uploaded;
    }

    // Validation
    const trimmedContent = content?.trim();

    const finalContent =
      content !== undefined
        ? trimmedContent
        : existingPost.content;

    const finalAttachments = shouldReplaceAttachments
      ? newAttachments
      : existingPost.attachments;

    if (
      (!finalContent || finalContent.length === 0) &&
      finalAttachments.length === 0
    ) {
      throw new BadRequestError(
        "Post must contain text or media."
      );
    }

    // Prepare update object
    const updateData: Partial<IPost> = {};

    if (content !== undefined) {
      updateData.content = trimmedContent;
    }

    if (privacy !== undefined) {
      updateData.privacy = privacy;
    }

    if (hasMentionsField) {
      updateData.mentions = mentions;
    }

    if (shouldReplaceAttachments) {
      updateData.attachments = newAttachments;
    }

    try {
      // Update DB
      const updatedPost = await this.postRepository.findAndUpdate(
        { _id: postId },
        { $set: updateData },
        {
          new: true,
          lean: true,
        }
      );

      if (!updatedPost) {
        throw new NotFoundError("Failed to update post");
      }

      // Delete old attachments
      if (
        shouldReplaceAttachments &&
        existingPost.attachments.length > 0
      ) {
        void Promise.allSettled(
          existingPost.attachments.map((attachment) =>
            cloudinary.uploader.destroy(attachment.public_id)
          )
        );
      }

      // Send mention emails
      if (hasMentionsField && req.mentionedUsers?.length) {
        void sendMentionEmails({
          users: req.mentionedUsers,
          sender: req.user,
          entityType: "post",
          postId: updatedPost._id.toString(),
          content: updatedPost.content,
        }).catch(console.error);
      }

      return res.status(200).json({
        success: true,
        message: "Post updated successfully",
        data: {
          _id: updatedPost._id,
          user: formatUser(updatedPost.userId),
          content: updatedPost.content,
          mentions: updatedPost.mentions ?? [],
          attachments: formatPostAttachments(updatedPost.attachments ?? []),
          privacy: updatedPost.privacy,
          createdAt: updatedPost.createdAt,
          updatedAt: updatedPost.updatedAt,
        },
      });
    } catch (error) {
      // delete uploaded files if DB failed
      if (newAttachments.length) {
        await Promise.allSettled(
          newAttachments.map((attachment) =>
            cloudinary.uploader.destroy(attachment.public_id)
          )
        );
      }

      throw error;
    }
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
              $or: [{ isDeleted: false }, { isDeleted: true, hasReplies: true }]
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
    // ✅ Validate post privacy
    await validatePostPrivacy({
      post,
      currentUser: req.user,
      friendRepository: this.friendRepository,
    });

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
        attachments: formatPostAttachments(post.attachments),
        mentions: post.mentions ?? [],

        privacy: post.privacy,

        reactionsSummary: postReactionsSummary,

        previewComments,

        createdAt: post.createdAt,
      },
      meta: {
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
      {
        $set: {
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
