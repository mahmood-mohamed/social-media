import { ObjectId } from "mongoose";
import { IPost, Reactions } from "../../../utils";
import { AbstractRepository } from "../../abstract.repository";
import { Post } from "./post.model";

export class PostRepository extends AbstractRepository<IPost> {
  constructor() {
    super(Post);
  }
  
  async handleReaction(post: IPost, userId: ObjectId, reaction?: Reactions | null) {
    const now = new Date();
    const hasReaction = post.reactions?.find(r => String(r.userId) === String(userId) );

    if (reaction == null) {
      if (hasReaction){
        //* 🗑️ explicit remove
        await Post.updateOne(
          { _id: post._id, "reactions.userId": userId },
          { $pull: { reactions: { userId } } }
        );
        return { action: "removed" };
      }
      //* ➕ user has no reaction → add default LIKE
      await Post.updateOne(
        { _id: post._id },
        { $push: { reactions: { userId, reaction: Reactions.LIKE, createdAt: now, updatedAt: now } } }
      );
      return { action: "add-default-like" };
    }

    if (hasReaction) {
      if (hasReaction.reaction === reaction){
        //* 🗑️ toggle off
        await Post.updateOne(
          { _id: post._id },
          { $pull: { reactions: { userId } } }
        );
        return { action: "toggled-off" };
      }

      //* ✏️ update if exists
      await Post.updateOne(
        { _id: post._id, "reactions.userId": userId },
        { $set: { "reactions.$.reaction": reaction, "reactions.$.updatedAt": now } },
      );
      return { action: "updated" };
    }

    //* ➕ create new reaction
    await Post.updateOne(
      { _id: post._id },
      { $push: { reactions: { userId, reaction, createdAt: now, updatedAt: now } } }
    );
    return { action: "added" };

  };

};
