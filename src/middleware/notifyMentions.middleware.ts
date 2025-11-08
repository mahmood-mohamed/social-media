import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { BadRequestError, IUser, sendMail } from "../utils";
import { UserRepository } from "../DB";

// middleware to validate mentions in a post, comment & reply 
// >>> return next if valid mention ids and send massage in mail
export const notifyMentions = 
  (entityType: "post" | "comment") => {
  return async ( req: Request, res: Response, next: NextFunction)  => {
    try {
      let { mentions, content } = req.body;
      const userId = req.user._id.toString(); 

      // 🧩 Handle mentions if sent as JSON string (from FormData)
      if (typeof mentions === "string") {
        try {
          mentions = JSON.parse(mentions);
        } catch {
          throw new BadRequestError("Invalid mentions format");
        }
      }

      //☑️ Skip if no mentions provided
      if (!mentions || !Array.isArray(mentions) || mentions.length === 0) {
        return next();
      }

      //✅ check if mention ids are valid
      const invalidIds = mentions.filter(
        (id: string) => !mongoose.Types.ObjectId.isValid(id)
      );

      if (invalidIds.length > 0) {
        throw new BadRequestError(`Invalid mention IDs: ${invalidIds.join(", ")} `);
      }

      //✅ check if mention ids are valid
      if (mentions.includes(userId)) {
        mentions = mentions.filter((id: string) => id !== userId);
      }

      const userRepo = new UserRepository();
    //1️⃣ check if mentioned users exist
      const existingUsers = await userRepo.find({
        _id: { $in: mentions },
      });

      if (!existingUsers || existingUsers.length === 0) {
        throw new BadRequestError("No mentioned users found");
      }
      //2️⃣ check if all mentioned users exist
      if (existingUsers.length !== mentions.length) {
        const existingIds = existingUsers.map((u) => u._id.toString());
        const missingIds = mentions.filter((id: string) => !existingIds.includes(id));

        throw new BadRequestError(
          `Mentioned users not found: ${missingIds.join(", ")}`
        );
      }
      
      // 3️⃣📩 Send emails to all mentioned users (in parallel)
      await Promise.all(
        existingUsers.map(async (user: IUser) => {
          const htmlMessage = `
            <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
              <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #333;">👋 Hey ${user.firstName || "there"}!</h2>
                <p style="font-size: 15px; color: #444;">
                  You’ve been <strong>mentioned in a ${entityType}</strong> by 
                  <strong>${req.user?.firstName || "Someone"} ${req.user?.lastName || ""}</strong>.
                </p>
                ${
                  content
                    ? `<blockquote style="border-left: 4px solid #007bff; margin: 15px 0; padding-left: 15px; color: #555;">
                        ${content}
                      </blockquote>`
                    : ""
                }
                <p style="font-size: 14px; color: #666;">
                  👉 <a href="https://socialapp.com/${entityType}s/" style="color: #007bff;">View the ${entityType}</a>
                </p>
              </div>
            </div>
          `;
          await sendMail({
            to: user.email,
            subject: `You've been mentioned in a ${entityType}`,
            html: htmlMessage,
          });
        })
      ).catch(console.error); // Log email sending errors but don't block the request

      //* 🧭 Proceed to next middleware/controller
      next();
    } catch (error) {
      next(error);
    }
  };
}
