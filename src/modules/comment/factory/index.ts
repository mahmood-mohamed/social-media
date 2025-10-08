import { ObjectId } from "mongoose";
import { ICreateCommentDto } from "../comment.dto";
import { CommentEntity } from "../entity";

export class CommentFactory {
  createComment(
    createCommentDTO: ICreateCommentDto,
    userId: ObjectId,
    postId: ObjectId,
    parentId: ObjectId,
  ) {
    const newComment = new CommentEntity();
    newComment.userId = userId;
    newComment.postId = postId;
    newComment.parentId = parentId;
    newComment.content = createCommentDTO.content;
    newComment.mentions = createCommentDTO.mentions || [];
    newComment.attachments = createCommentDTO.attachments || [];
    newComment.reactions = [];
    return newComment;
  }
}
