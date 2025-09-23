import { UserAgent, UserRoles } from "../../../utils/common/enums";
import { hashPassword } from "../../../utils/hash";
import { generateExpiryTime, generateOTP } from "../../../utils/OTP";
import { IGoogleLoginDTO, IRegisterDTO } from "../auth.dto";
import { UserEntity } from "../entity";
import { OAuth2Client } from "google-auth-library";

export class AuthFactoryService {
  register(registerDTO: IRegisterDTO) {
    const user = new UserEntity(); // Create a new user entity

    user.firstName = registerDTO.firstName;
    user.lastName = registerDTO.lastName;
    user.email = registerDTO.email;
    user.password = hashPassword(registerDTO.password); // Hash the password before storing
    user.gender = registerDTO.gender;
    user.role = UserRoles.USER;
    user.otp = generateOTP();
    user.otpExpiryAt = generateExpiryTime(); // OTP valid for 5 minutes
    user.isActive = true;
    user.isVerified = false;
    user.credentialUpdatedAt = new Date();

    return user; // Return the registered user
  }

  async googleLogin(googleLoginDTO: IGoogleLoginDTO) {
    const user = new UserEntity();

    const client = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    });

    const ticket = await client.verifyIdToken({
      idToken: googleLoginDTO.idToken,
      audience: process.env.GOOGLE_CLIENT_ID as string,
    });

    const payload = ticket.getPayload();

    user.firstName = payload?.given_name as string;
    user.lastName = payload?.family_name as string;
    user.email = payload?.email as string;
    user.userAgent = UserAgent.GOOGLE;
    user.role = UserRoles.USER;
    user.isActive = true;
    user.isVerified = true;
    user.credentialUpdatedAt = new Date();
    return user;
  }
}
