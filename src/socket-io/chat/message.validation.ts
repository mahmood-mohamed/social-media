import z from "zod";


// Send Message Schema
export const sendMessageSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty"),
  destId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"),
});

