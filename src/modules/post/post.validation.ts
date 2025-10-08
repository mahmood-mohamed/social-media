import z from "zod";
import { Reactions } from "../../utils";

const generalPostSchema = z.object({
    content: z.string().min(1, "Content is required").trim().optional(),
    attachments: z.array(z.string()).optional(),
    mentions: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format")).optional(), // [ObjectId]
})


export const createPostSchema = generalPostSchema.refine(
  (data) => data.content || (data.attachments && data.attachments.length > 0),
  {
    message: "Post must have content or at least one attachment",
    path: ["content"],
  }
);


export const updatePostSchema = generalPostSchema.partial().refine(
    (data) => data.content !== undefined || (data.attachments && data.attachments.length > 0),
    {
      message: "Post must have content or at least one attachment",
      path: ["content"],
    }
);

export const deletePostSchema = z.object({
    postId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
})

export const reactionSchema = z.object({
    postId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"), // from params
    reaction: z.enum(Reactions).nullable().optional(), // from body
})
