import { Schema } from "mongoose";
import { IPost, Reactions } from "../../../utils";
import { reactionSchema } from "../common";



export const postSchema = new Schema<IPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: function () { 
      if(this.attachments?.length)
        return false; 
      else 
        return true 
    }, trim: true },
    attachments: [{ type: String }],
    reactions: [ reactionSchema ],
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

postSchema.virtual("reactionsSummary").get(function () {
  if (!this.reactions) return {};

  const summary: Record<string, number> = {};

  for (const r of this.reactions) {
    const key = Reactions[r.reaction]; // Get the reaction key from the Reactions enum
    summary[key] = (summary[key] || 0) + 1;
  }

  return summary;
});
