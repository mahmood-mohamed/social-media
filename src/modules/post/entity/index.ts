import { ObjectId } from "mongoose";
import { IAttachment, IReaction } from "../../../utils";

export class PostEntity {
    userId!: ObjectId;
    content!: string;
    attachments?: IAttachment[];    // ✅ optional
    reactions!: IReaction[];
    mentions?: ObjectId[];          // ✅ optional
}
