import { ObjectId } from "mongoose";
import { ICreateCommentDto } from "../comment.dto";
import { CommentEntity } from "../entity";

export class CommentFactory {
  createComment(
    dto: ICreateCommentDto,
    userId: ObjectId,
    postId: ObjectId,
    parentId: ObjectId | null = null,
  ) {
    const comment = new CommentEntity();
    comment.userId = userId;
    comment.postId = postId;
    comment.parentId = parentId;
    comment.content = dto.content.trim() || "";
    comment.mentions = dto.mentions || [];
    comment.attachment = dto.attachment ?? { secure_url: null, public_id: null };
    return comment;
  }
}
