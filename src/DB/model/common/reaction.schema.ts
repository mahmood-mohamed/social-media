import { Schema } from "mongoose";
import { IReaction, Reactions } from "../../../utils";

export const reactionSchema = new Schema<IReaction>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    reaction: {
        type: Number,
        enum: Object.values(Reactions),
        default: Reactions.LIKE,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
},
{ _id: false }
);
