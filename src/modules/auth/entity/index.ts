import { Gender, UserAgent, UserRoles } from "../../../utils";

export class UserEntity {
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public password!: string;
  public isVerified!: boolean;
  public isActive!: boolean;
  public role!: UserRoles;
  public userAgent!: UserAgent;
  public gender!: Gender;
  // public profilePictureUrl!: string;
  public credentialUpdatedAt!: Date;
  public otp!: string;
  public otpExpiryAt!: Date;
}
