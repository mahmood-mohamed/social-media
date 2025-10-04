import { ObjectId } from "mongoose";
import { PostEntity } from "../entity";
import { ICreatePostDto } from "../post.dto";

export class PostFactoryService {
    createPost(createPostDTO: ICreatePostDto, userId: ObjectId){
        const newPost = new PostEntity();

        newPost.userId = userId;
        newPost.content = createPostDTO.content;
        // newPost.attachments = []; // TODO : add attachments Cloud s3
        newPost.reactions = [];

        return newPost
    }
};
