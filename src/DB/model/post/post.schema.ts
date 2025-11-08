import { Schema } from "mongoose";
import { IPost, PostDeletedBy, Reactions } from "../../../utils";
import { reactionSchema } from "../common";

export const postSchema = new Schema<IPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: {
      type: String,
      required: function () {
        if(this.attachments && this.attachments.length > 0) return false;
        else return true;
      },
      trim: true,
    },
    attachments: [ 
      {
        secure_url: { type: String, required: true },
        public_id: { type: String, required: true },
        type: { type: String, enum: ["image", "video"], default: "image" },
      }
    ],
    reactions: [reactionSchema],
    mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: String, enum: Object.values(PostDeletedBy), default: null },
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

// ✅ Indexes for performance
postSchema.index({ userId: 1, createdAt: -1 });

//
// ✅ Virtual: reactions summary (like, love, etc.)
//
postSchema.virtual("reactionsSummary").get(function () {
  if (!Array.isArray(this.reactions)) return {};

  return this.reactions.reduce((acc, r) => {
    const key = Reactions[r.reaction];
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
});

postSchema.virtual("comments",{
  localField: "_id", // post id
  foreignField: "postId", // comment post id
  ref: "Comment",
})

