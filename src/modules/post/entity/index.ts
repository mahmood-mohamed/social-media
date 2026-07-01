import { ObjectId } from "mongoose";
import { IAttachment, IReaction, PostPrivacy } from "../../../utils";


export class PostEntity {
    userId!: ObjectId;
    content?: string;
    attachments?: IAttachment[];
    reactions?: IReaction[];
    mentions?: ObjectId[];
    isDeleted!: boolean;
    privacy?: PostPrivacy;
}