
import { ObjectId } from 'mongoose';
import { NotFoundError, Reactions } from '../../../utils';
import { AbstractRepository } from '../../abstract.repository';


export class ReactionHelper {
  /**
   * Handles adding, toggling, or removing reactions for a specific document (e.g. Post, Comment)
   * @param repository The repository for the document being reacted on
   * @param parentId ID of the post/comment to react on
   * @param userId ID of the user performing the reaction
   * @param reaction (optional) Reaction type. If omitted, toggles or removes existing reaction.
   */

  async handleReactions <T extends { reactions?: any[] }> (
    repository: AbstractRepository<T>,
    parentId: string, 
    userId: ObjectId, 
    reaction?: Reactions,
    options?: { type?: "post" | "comment" }
  ): Promise<{ action: string }> {
    const now = new Date();
    const {type = "unknown"} = options || {};
    
    const parentDoc = await repository.findOne(
      { _id: parentId },
      { reactions: 1 }
    );    
    if (!parentDoc) {
      throw new NotFoundError(`${type} not found`);
    }
    const hasReaction = parentDoc.reactions?.find((r) => String(r.userId) === String(userId));
   
    //* 🧹 Remove or toggle off
    if (hasReaction && (reaction == null ||  hasReaction.reaction === reaction)) {
      await repository.update({ _id: parentId }, { $pull: { reactions: { userId } } });
      return { action: hasReaction ? "toggled-off" : "removed" };
    }
  
    //* 🔄 Update existing reaction
    if (hasReaction) {
      await repository.update(
        { _id: parentId, "reactions.userId": userId }, 
        { 
          $set: { 
            "reactions.$.reaction": reaction, 
            "reactions.$.updatedAt": now 
          } 
        }
      );
      return { action: "updated" };
    }
    //* ➕ Add new reaction
    await repository.update(
      { _id: parentId }, 
      { $push: { 
          reactions: { 
            userId, 
            reaction: reaction ?? Reactions.LIKE, 
            createdAt: now, 
            updatedAt: now 
          } 
        } 
      }
    );
    return { action: reaction == null ? "add-default-like" : "added" };


  }
};
