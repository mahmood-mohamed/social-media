import { ProjectionType, QueryOptions, RootFilterQuery } from "mongoose";
import { IUser } from "../../../utils";
import { AbstractRepository } from "../../abstract.repository";
import { User } from "./user.model";

export class UserRepository extends AbstractRepository<IUser> {
  constructor() {
    super(User);
  }

  userExists(
    filter: RootFilterQuery<IUser>,
    projection?: ProjectionType<IUser>,
    options?: QueryOptions
  ) {
    return this.model.findOne(filter, projection, options);
  }

  getAllUsers() {
    return this.model.find();
  }
}
