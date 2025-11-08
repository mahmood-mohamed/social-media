import z from "zod";

export const objectIdSchema = z
  .string()
  .length(24, "Invalid ID format")
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid Mongo ObjectId");

// ✅ dynamic schema for any id key(s)
export const idSchema = (keys: string | string[]) => {
    const fields = Array.isArray(keys) ? keys : [keys];
    const shape: Record<string, z.ZodString> = {};
    fields.forEach((key) => {
        shape[key] = objectIdSchema;
    });
    return z.object(shape);
};
