import { Gender, UserAgent, UserRoles } from "../../../utils/common/enum";


export class UserEntity {
    public fullName!: string;
    public email!: string;
    public password!: string;
    public phoneNumber!: string;
    public isVerified!: boolean;
    public isActive!: boolean;
    public role!: UserRoles;
    public userAgent!: UserAgent;
    public gender!: Gender;
    // public profilePictureUrl!: string;
    public credentialUpdatedAt!: Date;
    public otp!: string;
    public otpExpiryAt!: Date;
};
