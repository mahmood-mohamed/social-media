import { model } from "mongoose";
import { userSchema } from "./user.schema";



export const User = model("User", userSchema);
