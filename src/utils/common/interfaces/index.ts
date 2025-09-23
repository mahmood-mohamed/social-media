import { Gender, UserAgent, UserRoles } from "../enums";

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isVerified: boolean;
  isActive: boolean;
  role: UserRoles;
  userAgent: UserAgent;
  gender?: Gender;
  profilePictureUrl?: string;
  followersCount?: number; // Add followersCount
  followingCount?: number; // Add followingCount
  credentialUpdatedAt: Date;
  otp?: string | undefined;
  otpExpiryAt?: Date | undefined;
}
