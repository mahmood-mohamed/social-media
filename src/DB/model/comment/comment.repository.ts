import { AbstractRepository } from "../../abstract.repository";
import { IComment } from "../../../utils";
import { Comment } from "./comment.model";
import { RootFilterQuery } from "mongoose";

export class CommentRepository extends AbstractRepository<IComment> {
  constructor() {
    super(Comment);
  }

  // async countComments(postId: ObjectId) {
  //   return await this.model.countDocuments({ postId });
  // }
  async countComments(filter: RootFilterQuery<IComment>) {
    return await this.model.countDocuments(filter);
  }
  
};
