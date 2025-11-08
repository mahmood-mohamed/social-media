import { ObjectId } from "mongoose";
import { IPost, Reactions } from "../../../utils";
import { AbstractRepository } from "../../abstract.repository";
import { Post } from "./post.model";
import { RootFilterQuery } from "mongoose";

export class PostRepository extends AbstractRepository<IPost> {
  constructor() {
    super(Post);
  }

  async count (filter: RootFilterQuery<IPost>) {
    return await this.model.countDocuments(filter);
  }
};
