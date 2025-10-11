import { ObjectId } from "mongoose";
import { Gender, Reactions, TokenType, UserAgent, UserRoles } from "../enums";
import { reactionSchema } from './../../../DB/model/common/reaction.schema';

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
  is2faEnabled?: boolean;
  otp?: string;
  otpExpiryAt?: Date;
  otpOldEmail?: string;
  otpNewEmail?: string;
  tempEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttachment {
  url: string;
  type: string;
  id: string;
}

export interface IReaction {
  userId: ObjectId;
  reaction: Reactions;
  createdAt: Date;
  updatedAt: Date;
}

export interface HasReactions extends Document {
  reactions: {
    userId: ObjectId;
    reaction: Reactions;
    createdAt: Date;
    updatedAt: Date;
  }[];
}
export interface IPost {
  _id: ObjectId;
  userId: ObjectId;
  content: string;
  attachments?: IAttachment[];
  reactions: IReaction[]; // e.g., { like: 10, love: 5 }
  mentions?: ObjectId[]; 
  createdAt: Date;
  updatedAt: Date;
}


export interface IComment {
  _id: ObjectId;
  postId: ObjectId;
  userId: ObjectId;
  parentId?: ObjectId;
  content: string;
  attachments?: IAttachment[];
  reactions?: IReaction[]; 
  mentions?: ObjectId[]; 
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

