
import { IBlockedUser, IFriendRequest, IFriendship } from '../../../utils';
import { AbstractRepository } from '../../abstract.repository';
import { FriendRequest } from './friendRequest.model';
import { Friendship } from './friendship.model';
import { BlockedUser } from './blockedUser.model';
import { ObjectId } from 'mongoose';
import { RootFilterQuery } from 'mongoose';

export class FriendRequestRepository extends AbstractRepository<IFriendRequest> {
    constructor() {
        super(FriendRequest);
    }
    async countFriendRequests(receiverId: ObjectId) {
        return await this.model.countDocuments({ receiverId });
    }
};

export class FriendshipRepository extends AbstractRepository<IFriendship> {
    constructor() {
        super(Friendship);
    }    
    async countFriends(userId: ObjectId) {
        return await this.model.countDocuments({ userId });
    }
};

export class BlockedUserRepository extends AbstractRepository<IBlockedUser> {
    constructor() {
        super(BlockedUser);
    }  

    async countBlockedUsers(blockerId: ObjectId) {
        return await this.model.countDocuments({ blockerId });
    }  
};
