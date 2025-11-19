import { ObjectId } from "mongoose";
import { FriendRequestStatus, Gender, Reactions, TokenType, UserAgent, UserRoles } from "../enums";

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
  gender: Gender;
  profilePicture: {
    secure_url: string;
    public_id: string;
  };
  followersCount: number; // Add followersCount
  followingCount: number; // Add followingCount
  credentialUpdatedAt: Date;
  is2faEnabled: boolean;
  otp?: string;
  otpExpiryAt?: Date;
  otpOldEmail?: string;
  otpNewEmail?: string;
  tempEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttachment {
  secure_url: string;
  public_id: string;
  type: string;
}
export interface ICommentAttachment {
    secure_url: string | null;
    public_id: string | null;
}
export interface IReaction {
  userId: ObjectId;
  reaction: Reactions;
  createdAt: Date;
  updatedAt: Date;
}

// *****       IMessages Interface         ******/
export interface IMessage {
  _id: ObjectId;
  sender: ObjectId;
  content: string;
  attachments?: IAttachment[];
  createdAt: Date;
  updatedAt: Date;
}
export interface IChat {
  users: ObjectId[];
  messages: ObjectId[];
}

// *****       HasReactions Interface         ******/
export interface HasReactions extends Document {
  reactions: {
    userId: ObjectId;
    reaction: Reactions;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

// ******       Post         ******/
export interface IPost {
  _id: ObjectId;
  userId: ObjectId;
  content: string;
  attachments: IAttachment[];
  reactions: IReaction[]; // e.g., { like: 10, love: 5 }
  mentions: ObjectId[] ; 
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  comments: IComment[]; // add comments virtual property
}

// ******       Comment         ******/
export interface IComment {
  _id: ObjectId;
  postId: ObjectId;
  userId: ObjectId;
  parentId: ObjectId | null;
  content: string | null;
  attachment: {
    secure_url: string | null;
    public_id: string | null;
  };
  reactions: IReaction[];
  mentions: ObjectId[];
  repliesCount: number;
  hasReplies: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

//******       Friendship         ******/
export interface IFriendRequest {
  _id: ObjectId;
  senderId: ObjectId;
  receiverId: ObjectId;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}
export interface IFriendship {
  _id: ObjectId;
  userId: ObjectId;
  friendId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export interface IBlockedUser {
  _id: ObjectId;
  blockerId: ObjectId; // The user who blocks
  blockedId: ObjectId; // The user who is blocked
  createdAt: Date;
  updatedAt: Date;
}

// ******       Token         ******/
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


// Augmenting Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user: IUser;
    }
  }
}

