import z from "zod";

export const idSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
});

export const searchUsersSchema = z.object({
  query: z.string().trim().min(1, "Query is required"),
});

export const updateLoggedInUserPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters long"),
  newPassword: z.string().min(6, "New Password must be at least 6 characters long"),
  confirmNewPassword: z.string().min(6, "Confirm New Password must be at least 6 characters long"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New Passwords do not match",
  path: ["confirmNewPassword"],
});

export const updateEmailSchema = z.object({
  email: z.email("Invalid email format").trim(),
});

export const updateUserEmailSchema = z.object({
  otpOldEmail: z.string().regex(/^[0-9]{6}$/, "OTP must be exactly 6 digits"),
  otpNewEmail: z.string().regex(/^[0-9]{6}$/, "OTP must be exactly 6 digits"),
}) 

export const enable2faSchema = z.object({
  otp: z.string().regex(/^[0-9]{6}$/, "OTP must be exactly 6 digits"),
});
