import { ObjectId } from "mongoose";
import { BlockedUserRepository } from "../../DB";
import { ForbiddenError } from "../error";

interface ValidateBlockRelationParams {
    currentUserId: ObjectId | string;
    targetUserId: ObjectId | string;
    blockRepository: BlockedUserRepository;
}

export const validateBlockRelation = async ({
    currentUserId,
    targetUserId,
    blockRepository,
}: ValidateBlockRelationParams): Promise<void> => {
    const currentId = currentUserId.toString();
    const targetId = targetUserId.toString();

    // Don't check against yourself
    if (currentId === targetId) {
        return;
    }

    const isBlocked = await blockRepository.exists({
        $or: [
            {
                blockerId: currentId,
                blockedId: targetId,
            },
            {
                blockerId: targetId,
                blockedId: currentId,
            },
        ],
    });

    if (isBlocked) {
        throw new ForbiddenError(
            "You cannot access this resource because one of the users has blocked the other."
        );
    }
};