import { ObjectId } from "mongoose";
import { IAttachment, IReaction } from "../../../utils";

export class CommentEntity {
      _id!: ObjectId;
      postId!: ObjectId;
      userId!: ObjectId;
      parentId?: ObjectId; // sorted from oldest to newest
      content!: string;
      mentions?: ObjectId[]; 
      attachments!: IAttachment[];
      reactions?: IReaction[]; 
}
