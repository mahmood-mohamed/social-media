import { AbstractRepository } from "../../abstract.repository";
import { IComment, Reactions } from "../../../utils";
import { Comment } from "./comment.model";
import { ObjectId } from "mongoose";

export class CommentRepository extends AbstractRepository<IComment> {
  constructor() {
    super(Comment);
  }

  
};
