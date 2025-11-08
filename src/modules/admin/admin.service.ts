import { Request, Response } from "express";
import { CommentRepository, PostRepository, UserRepository } from "../../DB";
import { CommentDeletedBy, formatPostAttachments, formatUser, getReactionsSummary, NotFoundError } from "../../utils";
import cloudinary from "../../config/cloudinary";

class AdminService {
  private readonly userRepository = new UserRepository();
  private readonly postRepository = new PostRepository();
  private readonly commentRepository = new CommentRepository();
  constructor() {}

  //* * POSTS CRUD METHODS * *//
  public getAllDeletedPosts = async (req: Request, res: Response) => {
    const page = Math.max(Math.abs(Number(req.query.page)) || 1, 1);
    const limit = Math.min(Math.max((Math.abs(Number(req.query.limit)) || 20), 1), 40);
    const posts = await this.postRepository.find(
      { isDeleted: true },
      {},
      { 
        sort: { deletedAt: -1 }, 
        skip: (page - 1) * limit, 
        limit,
        populate: {
          path: "userId",
          select: "firstName lastName profilePicture",
          model: "User"
        },
        lean: true 
      }
    );
    const count = await this.postRepository.count({ isDeleted: true });
    const formattedPosts = posts.map((post) => {
      return{
        _id: post._id,
        content: post.content,
        mentions: post.mentions,
        user: formatUser(post.userId),
        attachments: formatPostAttachments(post.attachments),
        reactions: getReactionsSummary(post.reactions),
        deletedAt: post.deletedAt,
        deletedBy: post.deletedBy
      }
  });
    res.status(200).json({ 
      success: true,
      message: "All deleted posts fetched successfully",
      data: formattedPosts,
      meta: {
        page,
        pageSize: limit,
        total: count,
        hasNext: count > page * limit
      }
    });
  };

  public hardDeletePost = async (req: Request, res: Response) => {
    const { postId } = req.params as { postId: string };

    // 🔍 Check if post exists
    const post = await this.postRepository.findOne({ _id: postId });
    if (!post) throw new NotFoundError("Post not found");

    // 🧹 Delete post attachments from Cloudinary (if any)
    if (post.attachments?.length > 0) {
      await Promise.all(
        post.attachments.map(async (attachment) => {
          if (attachment?.public_id) {
            await cloudinary.uploader.destroy(attachment.public_id).catch(() => null);
          }
        })
      );
    }

    // 💬 Find and clean up all related comments
    const comments = await this.commentRepository.find({ postId: post._id });
    if (comments.length > 0) {
      await Promise.all(
        comments.map(async (comment) => {
          if (comment?.attachment?.public_id) {
            await cloudinary.uploader.destroy(comment.attachment.public_id).catch(() => null);
          }
        })
      );
      // 🗑️ Delete all related comments
      await this.commentRepository.deleteMany({ postId: post._id });
    }

    // 🚮 Delete the post itself
    await this.postRepository.delete({ _id: postId });

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully (hard)",
    });
  };

  public restorePost = async (req: Request, res: Response) => {
    const { postId } = req.params as { postId: string };

    const post = await this.postRepository.findAndUpdate(
      { _id: postId, isDeleted: true },
      { $set: { isDeleted: false, deletedBy: null, deletedAt: null } },
      { 
        populate: { path: "userId", select: "firstName lastName fullName profilePicture" },
        new: true,
      }
    );

    if (!post) {
      throw new NotFoundError("Post not found or not deleted");
    }

    await this.commentRepository.updateMany(
      { postId: post._id, deletedBy: CommentDeletedBy.POST },
      { $set: { isDeleted: false, deletedBy: null, deletedAt: null } }
    );

    return res.status(200).json({
      success: true,
      message: "Post restored successfully",
      data: {
        id: post._id,
        user: formatUser(post.userId),
        content: post.content,
        mentions: post.mentions,
        attachments: formatPostAttachments(post.attachments),
        reactions: getReactionsSummary(post.reactions),
        isDeleted: post.isDeleted,
        createdAt: post.createdAt,
      },
    });
  };

  //* COMMENTS CRUD METHODS * *//
  public hardDeleteComment = async (req: Request, res: Response) => {
    const { commentId } = req.params as { commentId: string };
    const rootComment = await this.commentRepository.findOne(
      { _id: commentId },
      { _id: 1 },
      { lean: true }
    );
    if (!rootComment)  throw new NotFoundError("Comment not found");
  
    // 🧩 Collect all comments to delete (root + replies)
    const toDeleteIds: string[] = [commentId];
    const queue: string[] = [commentId];
    
    while (queue.length > 0){
      const parentId = queue.pop();
      const replies = await this.commentRepository.find({ parentId }, { _id: 1 }, { lean: true });

      if (replies.length > 0){
        const replyIds = replies.map(reply => String(reply._id));
        toDeleteIds.push(...replyIds);
        queue.push(...replyIds);
      }
    }

    // 🧹 Fetch all attachments for cleanup (only non-null ones)
    const allComments = await this.commentRepository.find(
      { 
        _id: { $in: toDeleteIds }, 
        "attachment.public_id": { $exists: true, $ne: null }  
      },
      { "attachment.public_id": 1 },
      { lean: true }
    );
    // 🧹 Destroy attachments
    const destroyOps = allComments
      .filter((c) => c?.attachment?.public_id)
      .map((c) => cloudinary.uploader.destroy(c.attachment.public_id as string).catch(() => null));
    await Promise.all(destroyOps);
    // 💣 Delete from DB 
    const deleteResult = await this.commentRepository.deleteMany({ _id: { $in: toDeleteIds } });

    return res.status(200).json({ 
      success: true, 
      message: `🗑️ ${deleteResult.deletedCount} comment(s) permanently deleted by admin.` 
    });
  };

  public restoreComment = async (req: Request, res: Response) => {
    const { commentId } = req.params as { commentId: string };

    const comment = await this.commentRepository.findOne(
      { _id: commentId, isDeleted: true },
      {},
      { lean: true }
    );

    if (!comment) {
      throw new NotFoundError("Comment not found or not deleted");
    }

    const toRestoreIds: string[] = [commentId];
    const queue: string[] = [commentId];

    while (queue.length > 0) {
      const parentId = queue.pop();
      const replies = await this.commentRepository.find(
        { parentId, isDeleted: true },
        { _id: 1 },
        { lean: true }
      );

      if (replies.length > 0) {
        const replyIds = replies.map((r) => String(r._id));
        toRestoreIds.push(...replyIds);
        queue.push(...replyIds);
      }
    }

    await this.commentRepository.updateMany(
      { _id: { $in: toRestoreIds } },
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: `✅ ${toRestoreIds.length} comment(s) restored successfully by admin.`,
    });

  };

}

export default new AdminService();
