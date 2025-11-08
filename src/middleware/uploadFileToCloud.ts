import multer from "multer";
import { Request } from "express";
import { BadRequestError } from "../utils";
import path from "path";
import fs from "fs";

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

function fileFilter (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif", "video/mp4", "video/mpeg", "video/quicktime"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new BadRequestError("Invalid file type."));
  }
  cb(null, true);
};

export const uploadFileToCloud = () => {
  const upload  = multer({ storage, fileFilter });
  return {
    single: (fieldName: string) => upload.single(fieldName),
    array: (fieldName: string, maxCount?: number) => upload.array(fieldName, maxCount),
    any: () => upload.any(),
  };
}
