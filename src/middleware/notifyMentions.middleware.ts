import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { BadRequestError } from "../utils";
import { UserRepository } from "../DB";

export const validateMentions = (_entityType: "post" | "comment") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // did the user send mentions
      const hasMentionsField = Object.prototype.hasOwnProperty.call(
        req.body,
        "mentions"
      );

      if (!hasMentionsField) {
        return next();
      }

      let { mentions } = req.body;
      const userId = req.user._id.toString();

      // Handle FormData
      if (typeof mentions === "string") {
        try {
          mentions = JSON.parse(mentions);
        } catch {
          throw new BadRequestError("Invalid mentions format");
        }
      }

      if (!Array.isArray(mentions)) {
        mentions = [];
      }

      // Remove duplicates
      mentions = [...new Set(mentions)];

      // Remove self mention
      mentions = mentions.filter((id: string) => id !== userId);

      // Validate ObjectIds
      const invalidIds = mentions.filter(
        (id: string) => !mongoose.Types.ObjectId.isValid(id)
      );

      if (invalidIds.length) {
        throw new BadRequestError(
          `Invalid mention IDs: ${invalidIds.join(", ")}`
        );
      }

      const userRepo = new UserRepository();

      const existingUsers = await userRepo.find({
        _id: { $in: mentions },
      });

      if (existingUsers.length !== mentions.length) {
        const existingIds = existingUsers.map((u) => u._id.toString());

        const missingIds = mentions.filter(
          (id: string) => !existingIds.includes(id)
        );

        throw new BadRequestError(
          `Mentioned users not found: ${missingIds.join(", ")}`
        );
      }

      req.body.mentions = mentions;
      req.mentionedUsers = existingUsers;

      return next();
    } catch (error) {
      next(error);
    }
  };
};