import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { BadRequestError, IUser } from "../utils";
import { UserRepository } from "../DB";

export const validateMentions = async ( req: Request, res: Response, next: NextFunction)  => {
  try {
    const { mentions } = req.body;

    // check if mentions exist
    if (!mentions || !Array.isArray(mentions) || mentions.length === 0) {
      return next();
    }

    // check if mention ids are valid
    const invalidIds = mentions.filter(
      (id: string) => !mongoose.Types.ObjectId.isValid(id)
    );

    if (invalidIds.length > 0) {
      throw new BadRequestError(`Invalid mention IDs: ${invalidIds.join(", ")} `);
    }
    const userRepo = new UserRepository();
    // check if mentioned users exist
    const existingUsers = await userRepo.find({
      _id: { $in: mentions },
    });

    if (!existingUsers || existingUsers.length === 0) {
      throw new BadRequestError("No mentioned users found");
    }
    // check if all mentioned users exist
    if (existingUsers.length !== mentions.length) {
      const existingIds = existingUsers.map((u) => u._id.toString());
      const missingIds = mentions.filter((id) => !existingIds.includes(id));

      throw new BadRequestError(
        `Mentioned users not found: ${missingIds.join(", ")}`
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
