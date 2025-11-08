import { model, Schema, Types } from "mongoose";
import { IFriendship } from "../../../utils";

// *****       Friendship Schema         ******/
const friendshipSchema = new Schema<IFriendship>({
        userId: { type: Types.ObjectId, ref: "User", required: true },
        friendId: { type: Types.ObjectId, ref: "User", required: true },
    }, 
    { timestamps: true }
);
// Create a unique index to prevent duplicate friendships
friendshipSchema.index({ userId: 1, friendId: 1 }, { unique: true });


// ******       Friendship Model         ******/
export const Friendship = model<IFriendship>("Friendship", friendshipSchema);
