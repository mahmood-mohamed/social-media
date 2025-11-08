import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import crypto from 'crypto';

export const generateHash = async(plainText: string): Promise<string> => {
    return await bcrypt.hash(plainText, 10); // synchronous hashing with salt rounds of 10
};

export const compareHash = async (plainText: string, hashedText: string): Promise<boolean> => {
    return await bcrypt.compare(plainText, hashedText); // synchronous comparison
};

export const generateFileHash = async (filePath: string) => {
  try {
    const buffer = await fs.readFile(filePath);
    return crypto.createHash("md5").update(buffer).digest("hex");
  } catch {
    return null;
  }
};
