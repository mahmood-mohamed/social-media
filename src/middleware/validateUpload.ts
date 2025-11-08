import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../utils";
import fs from "fs/promises";

// =============================================================
//  Validate Profile Picture Upload Middleware
// =============================================================
/**
 * Validate image upload for profile picture or comment attachment
 * @param required - if true => file must exist (used in profile), false => optional (used in comment)
 */
export const validateImageUpload = (required: boolean = true) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const file = req.file as Express.Multer.File | undefined;
    try {
      if (required && !file) {
        throw new BadRequestError("Image file is required");
      }
      if (file){
        if (!file.mimetype.startsWith("image/")){
          await fs.unlink(file.path).catch(() => null); // Delete the uploaded file
          throw new BadRequestError("Only image files are allowed");
        }
        const MAX_SIZE = 3 * 1024 * 1024; // 3MB
        if (file.size > MAX_SIZE) {
          await fs.unlink(file.path).catch(() => null); // Delete the uploaded file
          throw new BadRequestError("Image must be less than 3MB in size");
        }
      }
        next();
    } catch (error) {
      // On error, delete uploaded file to prevent storage bloat
      if (file) {
        await fs.unlink(file.path).catch(() => null);
      }
      next(error);
    }
  };
};


// =============================================================
//  Validate Upload Middleware [post or comment media validation]
// =============================================================
export const validateUpload =  async (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as Express.Multer.File[] | undefined;
  const content = req.body.content?.trim() || "";

  try{
    // 🔹 Check if files exist
    if (!content && (!files || files.length === 0)) {
      throw new BadRequestError("Post must have either content or media.");
    }
    // 🔹 If no have attached files, skip further validation
    if (!files || files.length === 0) {
      return next();
    }
    // 🔹 Set limits based on type
    const imageFiles = files.filter(f => f.mimetype.startsWith("image/"));
    const videoFiles = files.filter(f => f.mimetype.startsWith("video/"));
    if (imageFiles.length > 0 && videoFiles.length > 0) {
      throw new BadRequestError("You can upload either images or video, not both.");
    }
    if (imageFiles.length > 5) {
      throw new BadRequestError("You can upload up to 5 images for a post.");
    }
    if (videoFiles.length > 1) {
      throw new BadRequestError("You can upload only 1 video for a post.");
    }
  
    next();
    // On error, delete uploaded files to prevent storage bloat
  } catch (error) {
    if (files && files.length > 0) {
      await Promise.all(
        files.map(file =>
          fs.unlink(file.path).catch(() => null) // حذف الملف وتجاهل الأخطاء
        )
      );
    }

    next(error);
  }
};

