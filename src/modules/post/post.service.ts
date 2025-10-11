import { Request, Response } from "express";
import { CommentRepository, PostRepository } from "../../DB";
import { ICreatePostDto } from "./post.dto";
import { PostFactoryService } from "./factory";
import { NotFoundError, sendMail, UnauthorizedError } from "../../utils";
import { ObjectId } from "mongoose";
import { ReactionHelper } from "../../DB/model/common/reaction.repository";
import { UserRepository } from './../../DB/model/user/user.repository';

class PostService {
  private readonly postRepository = new PostRepository();
  private readonly postFactoryService = new PostFactoryService();
  private readonly userRepository = new UserRepository();
  private readonly commentRepository = new CommentRepository();
  private readonly reactionHelper = new ReactionHelper();
  constructor() {}

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

    //* if post has mentions >> send email
    if (createPostDto.mentions?.length) {
      const mentionedUsers = await this.userRepository.find(
        { _id: { $in: createPostDto.mentions } },
        { email: 1, firstName: 1, lastName: 1 }
      );
      // filter out undefined emails
      const emailPromises = mentionedUsers
      .filter(u => !!u.email)
      .map(user => {
        const htmlMessage = `
          <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333;">👋 Hey ${user.firstName || "there"}!</h2>
              <p style="font-size: 15px; color: #444;">
                You’ve been <strong>mentioned in a post</strong> by <strong>${req.user.firstName+" "+req.user.lastName || "someone"}</strong>.
              </p>
              <blockquote style="border-left: 4px solid #007bff; margin: 15px 0; padding-left: 15px; color: #555;">
                ${createPostDto.content}
              </blockquote>
              <p style="font-size: 14px; color: #666;">
                👉 <a href="https://socialapp.com/posts/${createdPost._id}" style="color: #007bff;">View the post</a>
              </p>
            </div>
          </div>
        `;

        return sendMail({
          to: user.email,
          subject: "📢 You were mentioned in a post!",
          text: `${req.user.firstName+" "+req.user.lastName || "Someone"} mentioned you in a post: ${createPostDto.content}`,
          html: htmlMessage,
        });
      });
      await Promise.all(emailPromises); // send emails in parallel
    }

    // return response
    return res.status(201)
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
      { updatedAt: 0, __v: 0 },
      {
        populate: [
          {path: "userId", select: "firstName lastName fullName"},
          // {path: "reactions.userId", select: "firstName lastName fullName"},
          {path: "comments", match: {parentIds: []}},
        ],
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
    const { action } = await this.reactionHelper.handleReactions(
      this.postRepository,
      postId, 
      userId, 
      reaction,
      { type: "post" }
    );

    return res.status(200).json({
      success: true,
      message: action,
    });
  };

  delete = async (req: Request, res: Response) => {
    const { postId } = req.params;
    const post = await this.postRepository.findOne({_id: postId});
    if(!post) {
      throw new NotFoundError("Post not found");
    }

    if(String(post.userId) !== String(req.user._id)) {
      throw new UnauthorizedError("You are not authorized to delete this post");
    }
    // delete post
    await this.postRepository.delete({ _id: postId });
    // delete comments
    await this.commentRepository.deleteMany({ postId: post._id });
    return res.sendStatus(204);
  }

}

export default new PostService();
