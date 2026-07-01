import { ObjectId } from "mongoose";
import { IAttachment, PostPrivacy } from "../../utils";


export interface ICreatePostDto {
  content: string;
  attachments: IAttachment[];
  mentions: ObjectId[];
  privacy: PostPrivacy;
}

export interface IUpdatePostDto {
  content: string;
  attachments: IAttachment[];
  mentions: ObjectId[];
  privacy: PostPrivacy;
}

