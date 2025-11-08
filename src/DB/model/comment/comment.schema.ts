import { Schema } from "mongoose";
import { CommentDeletedBy, IComment } from "../../../utils";
import { reactionSchema } from "../common";


export const commentSchema = new Schema<IComment>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
        parentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
        content: {
            type: String,
            required: function () {
                return !this.attachment?.secure_url;
            },
            trim: true,
            default: null,
        },
        attachment:{
            secure_url: { type: String, default: null },
            public_id: { type: String, default: null },
        },
        reactions: [reactionSchema],
        mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
        repliesCount: { type: Number, default: 0 }, // count of replies
        hasReplies: { type: Boolean, default: false }, // true if repliesCount > 0
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
        deletedBy: { type: String, enum: Object.values(CommentDeletedBy), default: null },
    },
    { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

commentSchema.virtual("replies", {
    ref: "Comment",
    localField: "_id",
    foreignField: "parentId",
});
