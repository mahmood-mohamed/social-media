import { ObjectId } from "mongoose";
import { PostEntity } from "../entity";
import { ICreatePostDto, IUpdatePostDto } from "../post.dto";

export class PostFactoryService {
    createPost(dto: ICreatePostDto, userId: ObjectId){
        const newPost = new PostEntity();

        newPost.userId = userId;
        newPost.content = dto.content?.trim();
        newPost.attachments = dto.attachments || []; // TODO : add attachments Cloud s3
        newPost.reactions = [];
        newPost.mentions = dto.mentions?.length ? dto.mentions : [];
        newPost.isDeleted = false;

        return newPost
    }
};
