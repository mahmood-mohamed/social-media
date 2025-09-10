import { Schema } from "mongoose";
import { Gender, UserAgent, UserRoles } from "../../../utils/common/enum";
import { IUser } from "../../../utils/common/interface";




export const userSchema = new Schema<IUser>( {
    firstName: { type: String, required: true, minLength: 3, maxLength: 20, trim: true },
    lastName: { type: String, required: true, minLength: 3, maxLength : 20, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { 
        type: String, 
        required: function() { 
            if(this.userAgent == UserAgent.GOOGLE) return false;
            else  return true;
        } 
    },
    phoneNumber: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    role: { type: String, enum: Object.values(UserRoles), default: UserRoles.USER },
    userAgent: { type: String, enum: Object.values(UserAgent), default: UserAgent.LOCAL },
    gender: { type: String, enum: Object.values(Gender), default: Gender.MALE },
    profilePictureUrl: { type: String },
    credentialUpdatedAt: { type: Date, default: Date.now },  
    otp: { type: String },
    otpExpiryAt: { type: Date }
} , 
{
    timestamps: true, 
    toObject: {virtuals: true}, 
    toJSON: {virtuals: true}
});

// Full name virtual field
userSchema
  .virtual("fullName")
  .get(function() {
      return `${this.firstName} ${this.lastName}`;
  })
  .set(function(fullName: string) {
      const [firstName, lastName] = fullName.split(" ");
      this.firstName = firstName as string;
      this.lastName = lastName as string;
  });
