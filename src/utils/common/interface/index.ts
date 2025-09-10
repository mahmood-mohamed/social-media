import { Gender, UserAgent, UserRoles } from "../enum";


export interface IUser {
    firstName: string;
    lastName: string;
    fullName?: string;
    email: string;
    password: string;
    phoneNumber?: string;
    isVerified: boolean;
    isActive: boolean;
    role: UserRoles;
    userAgent: UserAgent;
    gender?: Gender;
    profilePictureUrl?: string;
    credentialUpdatedAt: Date;
    otp?: string;
    otpExpiryAt?: Date;
}
