import bcrypt from 'bcryptjs';

export const hashPassword = (plainText: string): string => {
    return bcrypt.hashSync(plainText, 10); // synchronous hashing with salt rounds of 10
};

export const comparePassword = (plainText: string, hashedText: string): boolean => {
    return bcrypt.compareSync(plainText, hashedText); // synchronous comparison
};

