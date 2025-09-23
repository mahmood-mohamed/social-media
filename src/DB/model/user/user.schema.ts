import { Schema } from "mongoose";
import { Gender, UserAgent, UserRoles } from "../../../utils/common/enums";
import { IUser } from "../../../utils/common/interfaces";
import { sendMail, otpEmailTemplate } from "../../../utils/email";

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
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    credentialUpdatedAt: { type: Date, default: Date.now },
    otp: { type: String, default: undefined },
    otpExpiryAt: { type: Date, default: undefined },
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

userSchema.pre("save", function (next) {
  if (this.userAgent === UserAgent.LOCAL) {
    sendMail({
      to: this.email,
      subject: "Confirm your email address",
      html: otpEmailTemplate(this.otp as string, this.firstName),
    });
    next();
  }
});
