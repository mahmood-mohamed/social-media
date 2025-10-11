import { Schema } from "mongoose";
import { IComment } from "../../../utils";
import { reactionSchema } from "../common";


export const commentSchema = new Schema<IComment>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
        parentId: { type: Schema.Types.ObjectId, ref: "Comment" },
        content: {
            type: String,
            required: function () {
                if (this.attachments && this.attachments.length > 0) return false;
                else return true;
            },
            trim: true,
        },
        attachments: [
            {
                url: { type: String, required: true },
                type: { type: String, enum: ["image", "video", "file"], default: "image" },
            }
        ],
        reactions: [reactionSchema],
        mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

commentSchema.virtual("replies", {
    ref: "Comment",
    localField: "_id",
    foreignField: "parentId",
});
