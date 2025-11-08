import { ObjectId } from "mongoose";



export interface ICreateCommentDto { // from body
    content: string;
    attachment: { secure_url: string; public_id: string } | null;
    mentions: ObjectId[];
}
