import { Schema } from "mongoose";
import { Gender, UserAgent, UserRoles } from "../../../utils/common/enums";
import { IUser } from "../../../utils/common/interfaces";

export const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 20,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 20,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function () {
        if (this.userAgent == UserAgent.GOOGLE) return false;
        else return true;
      },
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    role: {
      type: String,
      enum: Object.values(UserRoles),
      default: UserRoles.USER,
    },
    userAgent: {
      type: String,
      enum: Object.values(UserAgent),
      default: UserAgent.LOCAL,
    },
    gender: { type: String, enum: Object.values(Gender), default: Gender.MALE },
    profilePictureUrl: { type: String },
    credentialUpdatedAt: { type: Date, default: Date.now },
    // 2 step verification
    is2faEnabled: { type: Boolean, default: false },
    // OTP
    otp: { type: String },
    otpOldEmail: { type: String },
    otpNewEmail: { type: String },
    tempEmail: { type: String },
    otpExpiryAt: { type: Date },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// Full name virtual fieldSocial Media
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

