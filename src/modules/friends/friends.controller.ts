import { Router } from "express";
import friendsService from "./friends.service";
import * as FV from "./friends.validation";
import { isAuthenticated, isValid } from "../../middleware";
import { checkBlockStatus } from "../../middleware/checkBlockStatus";

const router = Router();
router.use(isAuthenticated());

//****  Suggest Friends Routes  ****//
router.get("/suggest", friendsService.getSuggestFriends);

//****  Friend Requests Routes  ****//
router.get("/requests", friendsService.getFriendRequests);
router.post(
  "/requests/send",
  isValid(FV.idSchema("receiverId")),
  checkBlockStatus("receivedId"),
  friendsService.sendFriendRequest
);
router.patch(
  "/requests/:requestId/accept",
  isValid(FV.idSchema("requestId")),
  friendsService.acceptFriendRequest
);
router.patch(
  "/requests/:requestId/reject",
  isValid(FV.idSchema("requestId")),
  friendsService.rejectFriendRequest
);
router.delete(
  "/requests/:requestId/cancel",
  isValid(FV.idSchema("requestId")),
  friendsService.cancelFriendRequest
);

// ****  Friendships Routes  ****//
router.get("/", friendsService.getFriends);
router.delete(
  "/:friendId/unfriend",
  isValid(FV.idSchema("friendId")),
  friendsService.unfriend
);

// ****  Blocks Routes  ****//
router.get("/blocked", friendsService.getBlockedUsers);
router.post(
  "/:blockedId/block",
  isValid(FV.idSchema("blockedId")),
  friendsService.blockUser
);
router.delete(
  "/:blockedId/unblock",
  isValid(FV.idSchema("blockedId")),
  friendsService.unblockUser
);

export default router;
