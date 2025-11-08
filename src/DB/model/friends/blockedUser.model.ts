import { model, Schema, Types } from "mongoose";
import { IBlockedUser } from "../../../utils";

const blockedUserSchema = new Schema<IBlockedUser>({
    blockerId: { type: Types.ObjectId, ref: "User", required: true },
    blockedId: { type: Types.ObjectId, ref: "User", required: true },
  }, 
  { timestamps: true } // UpdatedAt is not that useful here after creation
);
// Create a unique index to prevent duplicate blocked users
blockedUserSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });


// ******       BlockedUser Model         ******/
export const BlockedUser = model<IBlockedUser>("BlockedUser", blockedUserSchema);       
