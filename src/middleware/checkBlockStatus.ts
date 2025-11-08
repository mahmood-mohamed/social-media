import { Types } from "mongoose";
import { ForbiddenError } from "../utils";
import { NextFunction, Request, Response } from "express";
import { BlockedUserRepository } from "../DB";



export const checkBlockStatus = (targetField: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const currentUserId = req.user._id;
    const targetId = req.body[targetField] || req.params[targetField];

    // ✅ If no targetId provided, skip the check
    if (!targetId) return next();

    const blockedUserRepository = new BlockedUserRepository();

    // 🕵️‍♂️ check both directions (A → B or B → A)
    const blockExists = await blockedUserRepository.findOne({
      $or: [
        { blockerId: currentUserId, blockedId: new Types.ObjectId(targetId) },
        { blockerId: new Types.ObjectId(targetId), blockedId: currentUserId },
      ],
    });

    if (blockExists) {
      throw new ForbiddenError("🚫 You cannot interact with this user");
    }

    next();
  };
};
