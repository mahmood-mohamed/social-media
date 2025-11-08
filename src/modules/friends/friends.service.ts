import { Request, Response } from "express";
import { BlockedUserRepository, FriendRequestRepository, FriendshipRepository, UserRepository } from "../../DB";
import { BadRequestError, formatUser, FriendRequestStatus, NotFoundError, UserRoles } from "../../utils";
import { ObjectId, Types } from "mongoose";



export class FriendsService {
    private readonly friendRequestRepository = new FriendRequestRepository();
    private readonly friendshipRepository = new FriendshipRepository();
    private readonly blockedUserRepository = new BlockedUserRepository();
    private readonly userRepository = new UserRepository();

    //****  Suggest Friends  ****//
    public getSuggestFriends = async (req: Request, res: Response) => {
        const page = Math.max(Math.abs(Number(req.query.page)) || 1, 1);
        const limit = Math.min(Math.max((Math.abs(Number(req.query.limit)) || 20), 1), 40); // default 20, max 40
        const userId = req.user._id;
        const search = req.query.search; // 🔍 optional search by name

        //1️⃣ get all friends
        const friendship = await this.friendshipRepository.find(
            { userId },
            {},
            { select: "friendId", lean: true }
        );
        const friendIds = friendship.map(f => String(f.friendId));
        
        //2️⃣ get all friend requests
        const friendRequests = await this.friendRequestRepository.find(
            { $or: [{ senderId: userId }, { receiverId: userId }] },
            {},
            { select: "senderId receiverId", lean: true }
        );
        const requestedIds = friendRequests.map((f) => String(f.senderId) === String(userId) ? String(f.receiverId) : String(f.senderId));

        //3️⃣ get all blocked users
        const blockedUsers = await this.blockedUserRepository.find(
            { $or: [{ blockerId: userId }, { blockedId: userId }] },
            {},
            { select: "blockerId blockedId", lean: true }
        );
        const blockedIds = blockedUsers.map((f) => String(f.blockerId) === String(userId) ? String(f.blockedId) : String(f.blockerId));
        
        //4️⃣ exclude blocked users, friend requests, friends and current user
        const excludedIds = [...new Set([
            String(userId),
            ...friendIds, 
            ...requestedIds, 
            ...blockedIds, 
        ])];
        //5️⃣ Build filter for suggested users
        const filter: any = {
            _id: { $nin: excludedIds },
            role: UserRoles.USER,
        }
        //✅ Optional search by name (before pagination)
        if (search) {
            filter.$or = [
                { firstName: { $regex: `^${search}`, $options: "i" } },
                { lastName: { $regex: `^${search}`, $options: "i" } },
                { fullName: { $regex: `^${search}`, $options: "i" } }
            ]
        }

        //6️⃣ Fetch suggested users with pagination 
        const users = await this.userRepository.find(
            filter,
            {},
            { 
                sort: { createdAt: -1 },
                skip: (page - 1) * limit,
                limit,
                select: "fullName firstName lastName profilePicture",
                lean: true
            }
        );
        // total number of suggest users
        const total = await this.userRepository.count(filter);

        //7️⃣ return suggest users
        return res.status(200).json({
            success: true,
            message: users.length === 0 ? "No suggested friends found" : "Suggested friends fetched successfully",
            data: users.map((user) => formatUser(user)),
            meta: {
                page,
                pageSize: limit,
                total,
                hasNext: page < Math.ceil(total / limit),
            }
        }); 
    };

    //****  Friend Requests Service  ****//
    public sendFriendRequest = async (req: Request, res: Response) => {
        const { receiverId } = req.body;
        const senderId = req.user._id;
        // 0️⃣ check self
        if (String(senderId) === String(receiverId)) {
            throw new BadRequestError("You cannot send a friend request to yourself.");
        }
        // 1️⃣ verify receiver exists
        const receiver = await this.userRepository.findById({_id: receiverId});
        if (!receiver) {
            throw new NotFoundError("Receiver user not found");
        }
        // 2️⃣ check blocked
        const isBlocked = await this.blockedUserRepository.findOne({
            $or: [
                { blockerId: senderId, blockedId: receiverId },
                { blockerId: receiverId, blockedId: senderId },
            ],
        });
        if (isBlocked) {
            throw new BadRequestError("Cannot send friend request, one of you has blocked the other");
        }
        // 3️⃣ check if already friends
        const isFriend = await this.friendshipRepository.findOne({ userId: senderId, friendId: receiverId });
        if (isFriend) {
            throw new BadRequestError("You are already friends");
        }
        // 4️⃣ check existing request
        const existingRequest = await this.friendRequestRepository.findOne({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId },
            ],
        });
        if (existingRequest) {
            // if received request is pending, accept it automatically
            if (existingRequest.status === FriendRequestStatus.PENDING && String(existingRequest.receiverId) === String(senderId)) {
                existingRequest.status = FriendRequestStatus.ACCEPTED;
                await existingRequest.save();

                // create friendship (two-way)
                await this.friendshipRepository.createMany([
                    { userId: senderId, friendId: receiverId },
                    { userId: receiverId, friendId: senderId },
                ]);
                return res.status(200).json({ success: true, message: "Friend request auto-accepted" });
            }
            throw new BadRequestError("A friend request already exists between you and this user.");
        }
        // 5️⃣ create new request
        const friendRequest = await this.friendRequestRepository.create({ senderId, receiverId, status: FriendRequestStatus.PENDING });
        
        return res.status(201).json({ success: true, message: "Friend request sent", data: { friendRequestId: friendRequest._id} });
    };

    public acceptFriendRequest = async (req: Request, res: Response) => {
        const { requestId } = req.params;
        const userId = req.user._id;

        // 1️⃣ check if the friend request exists and is pending
        const friendRequest = await this.friendRequestRepository.findOne({
            _id: requestId,
            receiverId: userId,
            status: FriendRequestStatus.PENDING,
        });
        if (!friendRequest) {
        throw new NotFoundError("Friend request not found or already handled");
        }

        // 2️⃣ update the friend request status to accepted
        friendRequest.status = FriendRequestStatus.ACCEPTED;
        await friendRequest.save();

        const { senderId, receiverId } = friendRequest;

        // 3️⃣ create friendship (two-way)
        await this.friendshipRepository.createMany([
            { userId: senderId, friendId: receiverId },
            { userId: receiverId, friendId: senderId },
        ]);

        return res.status(200).json({
        success: true,
        message: "Friend request accepted successfully",
        });
    };

    public rejectFriendRequest = async (req: Request, res: Response) => {
        const { requestId } = req.params;
        const userId = req.user._id;
    
        // 1️⃣ check if the friend request exists and is pending
        const friendRequest = await this.friendRequestRepository.findOne({
            _id: requestId,
            receiverId: userId,
            status: FriendRequestStatus.PENDING,
        });
        if (!friendRequest) {
            throw new NotFoundError("Friend request not found or already handled");
        }
    
        // 2️⃣ Update status to rejected
        await this.friendRequestRepository.update(
            { _id: requestId },
            { $set: { status: FriendRequestStatus.REJECTED } }
        );
    
        return res.status(200).json({
            success: true,
            message: "Friend request rejected successfully",
        });
    };

    public cancelFriendRequest = async (req: Request, res: Response) => {
        const { requestId } = req.params;
        const userId = req.user._id;
        // 1️⃣ Check if request exists and sent by current user
        const friendRequest = await this.friendRequestRepository.findOne({
            _id: requestId,
            senderId: userId,
            status: FriendRequestStatus.PENDING,
        });
        if (!friendRequest) {
            throw new NotFoundError("Friend request not found or already handled");
        }
        // 2️⃣ delete the friend request
        await this.friendRequestRepository.delete({ _id: requestId });
        return res.status(200).json({
            success: true,
            message: "Friend request canceled successfully",
        });
    };

    public getFriendRequests = async (req: Request, res: Response) => {
        const page = Math.max(Math.abs(Number(req.query.page)) || 1, 1);
        const limit = Math.min(Math.max((Math.abs(Number(req.query.limit)) || 20), 1), 40); // default 20, max 40

        const friendRequests = await this.friendRequestRepository.find(
            {
                receiverId: req.user._id,
                status: FriendRequestStatus.PENDING,
            },
            {},
            {   
                sort: { createdAt: -1 },
                skip: (page - 1) * limit,
                limit,
                populate: { path: "senderId", select: "firstName lastName profilePicture" },
                lean: true,
            } 
        );
        const totalCount = await this.friendRequestRepository.countFriendRequests(req.user._id);
        const formattedFriendRequests = friendRequests?.map((friendRequest) => {
            return {
                requestId: friendRequest._id,
                sender: formatUser(friendRequest.senderId),
                createdAt: friendRequest.createdAt
            }
        })
        return res.status(200).json({
            success: true,
            message: friendRequests.length === 0 ? "No friend requests found" : "Friend requests fetched successfully",
            data: formattedFriendRequests,
            meta:{
                page,
                pageSize: limit,
                total: totalCount,
                hasNext: totalCount > page * limit
            }
        });
    };

    //****  Friendship Service  ****//
    public getFriends = async (req: Request, res: Response) => {
        const page = Math.max(Math.abs(Number(req.query.page)) || 1, 1);
        const limit = Math.min(Math.max((Math.abs(Number(req.query.limit)) || 20), 1), 40); // default 20, max 40
        const friendship = await this.friendshipRepository.find(
            { userId: req.user._id }, 
            {},
            { 
                sort: { createdAt: -1 }, 
                skip: (page - 1) * limit, 
                limit, 
                populate: { 
                    path: "friendId", 
                    select: "firstName lastName fullName profilePicture" 
                },
                lean: true, 
            } 
        );
        const friends = friendship?.map((friendship) => {
            return {
                friend: formatUser(friendship.friendId),
                createdAt: friendship.createdAt
            }
        })
        // get total count
        const totalCount = await this.friendshipRepository.countFriends( req.user._id ); 
        return res.status(200).json({
            success: true,
            message: friends.length === 0 ? "No friends found" : "Friends fetched successfully",
            data: friends,
            meta: {
                page,
                pageSize: limit,
                total: totalCount,
                hasNext: totalCount > page * limit
            }
        });
    };

    public unfriend = async (req: Request, res: Response) => {
        const { friendId } = req.params;
        const userId = req.user._id;
        // 1️⃣ check if they are friends
        const friendship = await this.friendshipRepository.findOne({
            $or: [
                { userId, friendId },
                { userId: friendId, friendId: userId },
            ],
        });
        if (!friendship) {
            throw new NotFoundError("You are not friends with this user");
        }
        // 2️⃣ delete the friendship
        await this.friendshipRepository.delete({ _id: friendship._id });
        return res.status(200).json({ success: true, message: "Friendship deleted successfully" });
    };

    //****  Blocked Service  ****//
    public getBlockedUsers = async (req: Request, res: Response) => {
        const page = Math.max(Math.abs(Number(req.query.page)) || 1, 1);
        const limit = Math.min(Math.max((Math.abs(Number(req.query.limit)) || 20), 1), 40);
        const blockedUsers = await this.blockedUserRepository.find(
            { blockerId: req.user._id },
            {},
            { 
                sort: { createdAt: -1 }, skip: (page - 1) * limit, limit, 
                populate: { path: "blockedId", select: "firstName lastName fullName profilePicture" },
                lean: true, 
            }
        );
        const formattedBlockedUsers = blockedUsers?.map((blockedUser) => {
            return {
                blockedUser: formatUser(blockedUser.blockedId),
                createdAt: blockedUser.createdAt
            }
        })
        const totalCount = await this.blockedUserRepository.countBlockedUsers(req.user._id);
        return res.status(200).json({
            success: true,
            message: blockedUsers.length === 0 ? "No blocked users found" : "Blocked users fetched successfully",
            data: formattedBlockedUsers,
            meta: {
                page,
                pageSize: limit,
                total: totalCount,
                hasNext: totalCount > page * limit
            }
        })    
    };

    public blockUser = async (req: Request, res: Response) => {
        const { blockedId } = req.params;
        const blockerId = req.user._id;
        // 0️⃣ check self blocking
        if (String(blockerId) === String(blockedId)) {
            throw new BadRequestError("You cannot block yourself");
        } 
        // verify blocked user exists  
        if (!await this.userRepository.findById(blockedId)) {
            throw new NotFoundError("User to be blocked not found");
        }
        // 1️⃣ check if already blocked or not
        const isBlocked = await this.blockedUserRepository.findOne({
            $or: [
                { blockerId, blockedId },
                { blockerId: blockedId, blockedId: blockerId },
            ],
        });
        if (isBlocked) {
            throw new BadRequestError("You have already blocked this user");
        }
        // 2️⃣ remove any existing friend requests between the two users
        await this.friendRequestRepository.deleteMany({
            $or: [
                { senderId: blockerId, receiverId: blockedId },
                { senderId: blockedId, receiverId: blockerId },
            ],
        });
        // 3️⃣ remove any existing friendships between the two users
        await this.friendshipRepository.deleteMany({
            $or: [
                { userId: blockerId, friendId: blockedId },
                { userId: blockedId, friendId: blockerId },
            ],
        });
        // convert string -> ObjectId
        const blockedObjectId = new Types.ObjectId(blockedId);
        // 4️⃣ create block record
        await this.blockedUserRepository.create({ blockerId, blockedId: blockedObjectId as unknown as ObjectId });

        return res.status(200).json({ 
            success: true, 
            message: "User blocked successfully" 
        });
    };

    public unblockUser = async (req: Request, res: Response) => {
        const { blockedId } = req.params;
        const blockerId = req.user._id;
        // 0️⃣ check self unblocking
        if (String(blockerId) === String(blockedId)) {
            throw new BadRequestError("You cannot unblock yourself");
        }
        // 1️⃣ check if the user is actually blocked
        const isBlocked = await this.blockedUserRepository.findOne({ blockerId, blockedId });
        if (!isBlocked) {
            throw new NotFoundError("This user is not blocked");
        }
        // 2️⃣ delete the block record
        await this.blockedUserRepository.delete({ _id: isBlocked._id });
        return res.status(200).json({ success: true, message: "User unblocked successfully" });
    };

};

export default new FriendsService();
