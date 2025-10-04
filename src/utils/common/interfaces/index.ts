import { ObjectId } from "mongoose";
import { Gender, Reactions, TokenType, UserAgent, UserRoles } from "../enums";

export interface IUser {
  _id: ObjectId;
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

export interface IAttachment {
  url: string;
  type: string;
  id: string;
}

export interface IReaction {
  reaction: Reactions;
  userId: ObjectId;
}

export interface IPost {
  _id: ObjectId;
  userId: ObjectId;
  content: string;
  attachments: IAttachment[];
  reactions: IReaction[]; // e.g., { like: 10, love: 5 }
}


export interface IComment {
  // Define comment properties here
  postId: ObjectId;
  userId: ObjectId;
  content: string;
  replies?: IComment[];
  reactions?: { [key: string]: number }; // e.g., { like: 10, love: 5 }
  createdAt: Date;
  updatedAt: Date;
}


export interface IToken {
  userId: ObjectId;
  type:TokenType;
  token: string;
  expiresAt: Date;
}


declare module "jsonwebtoken" {
  export interface JwtPayload {
    id: ObjectId;
    role: UserRoles;
  }
}  

declare global {
  namespace Express {
    interface Request {
      user: IUser;
    }
  }
}

