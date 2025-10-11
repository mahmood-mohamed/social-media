import { Request, Response } from "express";
import { CommentRepository, ReactionHelper, PostRepository} from "../../DB";
import { IComment, IPost, NotFoundError, Reactions, UnauthorizedError } from "../../utils";
import { ICreateCommentDto } from "./comment.dto";
import { CommentFactory } from "./factory";

class CommentService {
  constructor() {}
  private readonly postRepository = new PostRepository();
  private readonly commentRepository = new CommentRepository();
  private readonly commentFactoryService = new CommentFactory();
  private readonly reactionHelper = new ReactionHelper();




  create = async (req: Request, res: Response) => {
    const createCommentDto: ICreateCommentDto = req.body;
    const { postId, commentId } = req.params;

    if(!postId && !commentId) throw new NotFoundError("You must provide either postId or commentId");

    let postExists: IPost | any = undefined;
    let commentExists: IComment | any = undefined;

    if (postId) {
      postExists = await this.postRepository.findOne({ _id: postId });
      if (!postExists) throw new NotFoundError("Post not found");
    }

    if (commentId) {
      commentExists = await this.commentRepository.findOne({ _id: commentId });
      if (!commentExists) throw new NotFoundError("Parent comment not found");
    }

    // ✅ Determine the postId correctly (even for replies)
    const targetPostId = postExists?._id || commentExists?.postId;
    if (!targetPostId) throw new NotFoundError("Cannot determine post for this comment");

    // 🏗️ prepare data comment >> factory >> create comment entity >> return comment entity >> repository
    const comment = this.commentFactoryService.createComment(
      createCommentDto,
      req.user._id,
      targetPostId,
      commentExists?._id
    );

    const commentCreated = await this.commentRepository.create(comment);
    return res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: commentCreated,
    });
  };

  getSpecific = async (req: Request, res: Response) => {
    const { commentId } = req.params as { commentId: string };
    const comment = await this.commentRepository.findOne(
      { _id: commentId },
      { updatedAt: 0, __v: 0 },
      {
        populate: [
          { path: "userId" as "user" , select: "firstName lastName fullName" },
          { path: "replies", match: { parentIds:  null } },
        ],
      }
    );
    if (!comment) throw new NotFoundError("Comment not found");
    return res.status(200).json({ success: true, message: "Comment retrieved successfully", data: comment });
  }

  reaction = async (req: Request, res: Response) => {
    const { reaction }: { reaction?: Reactions } = req.body;
    const { commentId } = req.params as { commentId: string };
    const comment = await this.commentRepository.findOne({ _id: commentId });
    if (!comment) throw new NotFoundError("Comment not found");

    const { action } = await this.reactionHelper.handleReactions(
      this.commentRepository, 
      commentId, 
      req.user._id, 
      reaction,
      {type: "comment"}
    );

    return res.status(200).json({ 
      success: true, 
      message: action,
    });

  };

  delete = async (req: Request, res: Response) => {
    const { commentId } = req.params as { commentId: string };
    const comment = await this.commentRepository.findOne({ _id: commentId });

    if (!comment) throw new NotFoundError("Comment not found");
    if (String(comment.userId) !== String(req.user._id)){
      throw new UnauthorizedError("Unauthorized to delete this comment");
    }

    const toDeleteIds: string[] = [commentId];
    const queue: string[] = [commentId];

    while(queue.length > 0) {
      const parentId = queue.pop();
      const replies = await this.commentRepository.find({ parentId }, { _id: 1 });

      if (replies.length > 0) {
        const replyIds = replies.map(reply => String(reply._id));
        toDeleteIds.push(...replyIds);
        queue.push(...replyIds);
      }
    }

    // 🧹 Bulk delete all comments & replies at once
    await this.commentRepository.deleteMany({ _id: { $in: toDeleteIds } });

    return res.status(200).json({
      success: true,
      message: "Comment and all related replies deleted successfully",
      deletedCount: toDeleteIds.length,
    });
  };
}

export default new CommentService();
