import { model, Schema, Types } from "mongoose";
import { FriendRequestStatus, IFriendRequest } from "../../../utils";


// *****       FriendRequest Schema         ******/
const friendRequestSchema = new Schema<IFriendRequest>({
    senderId: { type: Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: Object.values(FriendRequestStatus), default: FriendRequestStatus.PENDING },
  }, 
  { timestamps: true }
);
// Create a unique index to prevent duplicate friend requests
friendRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });


// ******       FriendRequest Model         ******/
export const FriendRequest = model<IFriendRequest>("FriendRequest", friendRequestSchema);
