import { Request, Response } from "express";
import { PostRepository } from "../../DB";
import { ICreatePostDto } from "./post.dto";
import { PostFactoryService } from "./factory";
import { NotFoundError } from "../../utils";
import { ObjectId } from "mongoose";

class PostService {
  private readonly postRepository = new PostRepository();
  private readonly postFactoryService = new PostFactoryService();

  create = async (req: Request, res: Response) => {
    // get data from request
    const createPostDto: ICreatePostDto = req.body;
    //* factory >> prepare data post >> create post entity >> return post entity >> repository
    const post = this.postFactoryService.createPost(
      createPostDto,
      req.user._id
    );
    // repository >> create post >> return post
    const createdPost = await this.postRepository.create(post);
    // return response
    return res
      .status(201)
      .json({
        success: true,
        message: "Post created successfully",
        data: createdPost,
      });
  };

  getSpecificPost = async (req: Request, res: Response) => {
    const { postId } = req.params;
    const post = await this.postRepository.findOne(
      { _id: postId },
      { },
      {
        populate: {
          path: "userId", select: "firstName lastName fullName",
        },
      }
    );
    if (!post) {
      throw new NotFoundError("Post not found");
    }
    return res.status(200).json({
      success: true,
      message: "Post retrieved successfully",
      data: post,
      meta: {
        reactionsCount: post.reactions.length || 0,
      }
    });
  };

  reaction = async (req: Request, res: Response) => {
    const { postId } = req.params as { postId: string };
    const { reaction } = req.body;
    const userId = req.user._id as ObjectId;

    // ✅ 1. Get post once
    const post = await this.postRepository.findOne({ _id: postId });
    if (!post) {
      throw new NotFoundError("Post not found");
    }

    // ✅ 2. Pass the existing post to repository (no need to re-fetch)
    const result = await this.postRepository.handleReaction(post, userId, reaction);

    return res.status(200).json(result);
  };

}

export default new PostService();
