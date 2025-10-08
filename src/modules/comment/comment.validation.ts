import z from "zod";
import { Reactions } from "../../utils";

// General reusable schema
const generalCommentSchema = z.object({
    content: z.string().trim().optional(),
    attachments: z.array(z.url("Invalid attachment URL")).optional(),
    mentions: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"))
    .optional(),
    reaction: z.enum(Reactions).optional(),
});

// ✅ Create Comment Schema
export const createCommentSchema = generalCommentSchema.refine(
  (data) => data.content || (data.attachments && data.attachments.length > 0),
  {
    message: "Comment must have content or at least one attachment",
    path: ["content"],
  }
);
