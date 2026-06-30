import { ObjectId } from "mongoose";
import { FriendshipRepository } from "../../DB";
import { IUser, PostPrivacy } from "../common";
import { ForbiddenError } from "../error";

interface ValidatePostPrivacyParams {
    post: {
        userId: ObjectId | IUser;
        privacy: PostPrivacy;
    };
    currentUser: IUser;
    friendRepository: FriendshipRepository;
}

export const validatePostPrivacy = async ({
    post,
    currentUser,
    friendRepository,
}: ValidatePostPrivacyParams): Promise<void> => {
    const postOwnerId = typeof post.userId === "object" && post.userId !== null && "_id" in post.userId
        ? post.userId._id.toString()
        : post.userId.toString();
    const currentUserId = currentUser._id.toString();

    // Owner can always view
    if (postOwnerId === currentUserId) {
        return;
    }
    switch (post.privacy) {
        case PostPrivacy.PUBLIC:
            return;

        case PostPrivacy.ONLY_ME:
            throw new ForbiddenError("This post is private.");

        case PostPrivacy.FRIENDS: {
            const isFriend = await friendRepository.exists({
                $or: [
                    {
                        senderId: postOwnerId,
                        receiverId: currentUserId,
                        status: "accepted",
                    },
                    {
                        senderId: currentUserId,
                        receiverId: postOwnerId,
                        status: "accepted",
                    },
                ],
            });

            if (!isFriend) {
                throw new ForbiddenError("This post is visible to friends only.");
            }

            return;
        }

        default:
            throw new ForbiddenError("You are not allowed to view this post.");
    }
};