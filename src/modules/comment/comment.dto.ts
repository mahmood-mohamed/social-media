import { ObjectId } from "mongoose";
import { IAttachment } from "../../utils";



export interface ICreateCommentDto { // from body
    content: string;
    attachments: IAttachment[];
    mentions: ObjectId[];
}
