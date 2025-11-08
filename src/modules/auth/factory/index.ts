import { devConfig } from "../../../config/env/dev.config";
import { UserAgent, UserRoles, generateHash, generateExpiryTime, generateOTP, BadRequestError } from "../../../utils";
import { IGoogleLoginDTO, IRegisterDTO } from "../auth.dto";
import { UserEntity } from "../entity";
import { OAuth2Client } from "google-auth-library";

export class AuthFactoryService {
  async register(registerDTO: IRegisterDTO) {
    const rawOtp = generateOTP();
    const user = new UserEntity(); // Create a new user entity

    user.firstName = registerDTO.firstName;
    user.lastName = registerDTO.lastName;
    user.email = registerDTO.email;
    user.password = await generateHash(registerDTO.password); // Hash the password before storing
    user.gender = registerDTO.gender;
    user.role = UserRoles.USER;
    user.otp = await generateHash(rawOtp); // Generate and hash the OTP
    user.otpExpiryAt = generateExpiryTime(); // OTP valid for 5 minutes
    user.isActive = true;
    user.isVerified = false;
    user.credentialUpdatedAt = new Date();

    return {user, rawOtp}; // Return the registered user, along with the raw OTP for sending via email
  }

  async googleLogin(googleLoginDTO: IGoogleLoginDTO) {
    const user = new UserEntity();

    const client = new OAuth2Client({
      clientId: devConfig.googleClientId as string,
      clientSecret: devConfig.googleClientSecret as string,
    });

    const ticket = await client.verifyIdToken({
      idToken: googleLoginDTO.idToken as string,
      audience: devConfig.googleClientId as string,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new BadRequestError("Invalid Google token");
    }

    console.log( "<<< payload from google login >>> ", payload );
    
    user.firstName = payload.given_name as string;
    user.lastName = payload.family_name as string;
    user.email = payload.email as string;
    user.userAgent = UserAgent.GOOGLE;
    user.role = UserRoles.USER;
    user.isActive = true;
    user.isVerified = true;
    user.credentialUpdatedAt = new Date();
    return {user};
  }
}
