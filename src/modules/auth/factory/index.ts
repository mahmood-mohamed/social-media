import { UserRoles } from "../../../utils/common/enum";
import { hashPassword } from "../../../utils/hash";
import { generateExpiryTime, generateOTP } from "../../../utils/OTP";
import { IRegisterDTO } from "../auth.dto";
import { UserEntity } from "../entity";

export class AuthFactoryService {
  register(registerDTO: IRegisterDTO) {
    const user = new UserEntity(); // Create a new user entity
  
    user.fullName = registerDTO.fullName;
    user.email = registerDTO.email;
    user.password = hashPassword(registerDTO.password); // Hash the password before storing
    user.phoneNumber = registerDTO.phoneNumber as string; // Optional field
    user.gender = registerDTO.gender;
    user.role = UserRoles.USER;
    user.otp = generateOTP();
    user.otpExpiryAt = generateExpiryTime(5); // OTP valid for 5 minutes
    user.isActive = true;
    user.isVerified = false;
    user.credentialUpdatedAt = new Date();
  
    return user; // Return the registered user
  }

}
