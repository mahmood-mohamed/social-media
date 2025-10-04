import bcrypt from 'bcryptjs';

export const generateHash = async(plainText: string): Promise<string> => {
    return await bcrypt.hash(plainText, 10); // synchronous hashing with salt rounds of 10
};

export const compareHash = async (plainText: string, hashedText: string): Promise<boolean> => {
    return await bcrypt.compare(plainText, hashedText); // synchronous comparison
};

