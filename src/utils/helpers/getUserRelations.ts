import { ObjectId } from "mongoose";
import { BlockedUserRepository, FriendshipRepository } from "../../DB";

interface GetUserRelationsParams {
    userId: ObjectId;
    friendRepository: FriendshipRepository;
    blockedUserRepository: BlockedUserRepository;
}

interface UserRelations {
    friendIds: ObjectId[];
    blockedIds: ObjectId[];
}

export const getUserRelations = async ({
    userId,
    friendRepository,
    blockedUserRepository,
}: GetUserRelationsParams): Promise<UserRelations> => {
    const [friendships, blockedUsers] = await Promise.all([
        friendRepository.find({
            userId,
        }),
        blockedUserRepository.find({
            $or: [
                { blockerId: userId },
                { blockedId: userId },
            ],
        }),
    ]);

    const friendIds = friendships.map((friend) => friend.friendId);

    const blockedIds = blockedUsers.map((block) =>
        block.blockerId.toString() === userId.toString()
            ? block.blockedId
            : block.blockerId
    );

    return {
        friendIds,
        blockedIds,
    };
};