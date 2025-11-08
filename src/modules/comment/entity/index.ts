import { ObjectId } from "mongoose";
import { CommentDeletedBy, IReaction } from "../../../utils";

export class CommentEntity {
      _id!: ObjectId;
      postId!: ObjectId;
      userId!: ObjectId;
      parentId: ObjectId | null = null; // sorted from oldest to newest
      content: string | null = null;
      mentions: ObjectId[] = []; 
      attachment: { secure_url: string | null; public_id: string | null } = {
            secure_url: null,
            public_id: null,
      };
      reactions: IReaction[] = []; 
      isDeleted: boolean = false;
      hasReplies: boolean = false;
      repliesCount: number = 0;
      deletedBy:  CommentDeletedBy | null = null;
      deletedAt: Date | null = null; 
}
