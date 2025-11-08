export enum UserRoles {
  USER = "user",
  MODERATOR = "moderator",
  ADMIN = "admin",
}

export enum UserAgent {
  LOCAL = "local",
  GOOGLE = "google",
}

export enum Gender {
  MALE = "male",
  FEMALE = "female",
}
export enum PostDeletedBy {
  USER = "user",
  ADMIN = "admin",
}
export enum CommentDeletedBy {
  USER = "user",
  POST = "post",
  POST_OWNER = "post_owner",
  ADMIN = "admin",
}

export enum TokenType {
  REFRESH = "refresh",
  ACCESS = "access",
}

export enum Reactions {
  LIKE = 1,
  LOVE = 2,
  CARE = 3,
  HAHA = 4,
  WOW = 5,
  SAD = 6,
  ANGRY = 7,
}

export enum FriendRequestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
}
