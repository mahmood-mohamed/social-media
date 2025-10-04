import z from "zod";
import { IRegisterDTO } from "./auth.dto";
import { Gender } from "../../utils/common/enums";

export const baseUserSchema = z.object<IRegisterDTO>({
  firstName: z.string().min(3).max(20) as unknown as string,
  lastName: z.string().min(3).max(20) as unknown as string,
  email: z.email() as unknown as string,
  password: z.string().min(6) as unknown as string,
  gender: z.enum(Gender).default(Gender.MALE) as unknown as Gender,
});

export const registerSchema = baseUserSchema;

export const verifyAccountSchema = baseUserSchema.pick({
    email: true,
  })
  .extend({
    otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
  });

export const loginSchema = baseUserSchema.pick({
  email: true,
  password: true,
});

// For Resend OTP and Forget Password
export const emailSchema = baseUserSchema.pick({
  email: true,
});

export const resetPasswordSchema = baseUserSchema
  .pick({
    email: true,
  })
  .extend({
    otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters long"),
    confirmNewPassword: z
      .string()
      .min(6, "Confirm Password must be at least 6 characters long"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(20, "Refresh token looks invalid")
    .refine((val) => val.trim() !== "" && val !== null && val !== undefined, 
    { message: "Refresh token is required" }) 
});

export const updateLoggedInUserPasswordSchema = baseUserSchema
  .pick({
    password: true,
  })
  .extend({
    newPassword: z
      .string()
      .min(6, "New Password must be at least 6 characters long"),
    confirmNewPassword: z
      .string()
      .min(6, "Confirm New Password must be at least 6 characters long"),
  }).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New Passwords do not match",
    path: ["confirmNewPassword"],
  })
