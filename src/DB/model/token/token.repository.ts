import { ProjectionType } from "mongoose";
import { IToken } from "../../../utils";
import { AbstractRepository } from "../../abstract.repository";
import { Token } from "./token.model";

export class TokenRepository extends AbstractRepository<IToken> {
  constructor() {
    super(Token);
  }

  createToken(tokenData: IToken) {
    return this.model.create(tokenData);
  }

  findToken(
    filter: Partial<IToken>,
    projection?: ProjectionType<IToken>,
    options?: object
  ) {
    return this.model.findOne(filter, projection, options);
  }

  deleteToken(filter: Partial<IToken>) {
    return this.delete(filter);
  }

  findTokenAndDelete(filter: Partial<IToken>) {
    return this.model.findOneAndDelete(filter);
  }
}
