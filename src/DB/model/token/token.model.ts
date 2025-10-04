import { Model, model } from "mongoose";
import { tokenSchema } from "./token.schema";
import { IToken } from "../../../utils";



// export const Token = model("Token", tokenSchema);
export const Token: Model<IToken> = model<IToken>("Token", tokenSchema);
