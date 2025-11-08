import { ObjectId } from "mongoose";
import { IAttachment } from "../../utils";

export interface ICreatePostDto {
  content: string;
  attachments: IAttachment[] | [];
  mentions: ObjectId[] | []; // [ObjectId]
}

export interface IUpdatePostDto {
  content: string;
  attachments: IAttachment[] | [];
  mentions: ObjectId[] | [];
}

