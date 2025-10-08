import { ObjectId } from "mongoose";

export interface ICreatePostDto {
  content: string;
  attachments?: string[]; // TODO: add type
  mentions?: ObjectId[]; // [ObjectId]
}

export interface IUpdatePostDto {
  content?: string;
  attachments?: string[]; // TODO: add type
}

