import type { Request, Response, NextFunction } from "express";
import * as authDTO from "./auth.dto";
import {
  BadRequestError, ConflictError, ForbiddenError, NotFoundError,
  IUser,
  comparePassword, hashPassword,
  generateExpiryTime, generateOTP,
  generateToken,
} from "../../utils";
import { UserRepository } from "../../DB";
import { AuthFactoryService } from "./factory";

// abstract.repository pattern
class AuthService {
  private userRepository = new UserRepository();
  private authFactoryService = new AuthFactoryService();
  constructor() {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    const registerDTO: authDTO.IRegisterDTO = req.body;
    // check if user already exists
    const userExists = await this.userRepository.userExists({
      email: registerDTO.email,
    }); // {User Document} | null
    if (userExists) {
      throw new ConflictError("User with this email already exists");
    }
    // prepare user entity using factory pattern
    const newUser = this.authFactoryService.register(registerDTO);

    // create user in DB
    const createdUser = await this.userRepository.create(
      newUser as unknown as Partial<IUser>
    );

    return res.status(201).json({
      success: true,
      message: "User created successfully. Please verify your email to login.",
      data: createdUser,
    });
  };

  verifyAccount = async (req: Request, res: Response) => {
    const verifyAccountDTO: authDTO.IVerifyAccountDTO = req.body;
    const user = await this.userRepository.userExists({
      email: verifyAccountDTO.email,
    });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (user.isVerified) {
      throw new BadRequestError("User is already verified");
    }
    if (!user.otp || !user.otpExpiryAt) {
      throw new BadRequestError(
        "User is not verified. Please check your email for a verification OTP."
      );
    }
    // verify OTP
    if (user.otp !== verifyAccountDTO.otp) {
      throw new BadRequestError("Invalid OTP");
    }
    if (user.otpExpiryAt < new Date()) {
      throw new BadRequestError("OTP has expired");
    }
    await this.userRepository.update(
      { _id: user._id }, // filter
      { isVerified: true, $unset: { otp: 1, otpExpiryAt: 1 } } // update | { $unset: { otp: 1, otpExpiryAt: 1 } >> remove otp and otpExpiryAt fields
    );

    return res.status(200).json({
      success: true,
      message: "User verified successfully, you can now login.",
    });
  };

  resendOTP = async (req: Request, res: Response) => {
    const resendDTO: authDTO.IResendOtpDTO = req.body;
    const user = await this.userRepository.userExists({
      email: resendDTO.email,
    });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (user.isVerified) {
      throw new BadRequestError("User is already verified, please login.");
    }
    user.otp = generateOTP();
    user.otpExpiryAt = generateExpiryTime(); // OTP valid for 5 minutes
    user.save(); // Save the updated user that has send OTP to user's email

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    // login logic
    const loginDTO: authDTO.ILoginDTO = req.body;
    const user = await this.userRepository.userExists({
      email: loginDTO.email,
    });
    if (!user) {
      throw new ConflictError("Invalid email or password");
    }
    if (!user.isVerified) {
      throw new ForbiddenError(
        "User is not verified. Please check your email for a verification OTP."
      );
    }
    const isValidPassword = comparePassword(loginDTO.password, user.password);
    if (!isValidPassword) {
      throw new ConflictError("Invalid email or password");
    }

    const accessToken = generateToken({
      tokenType: "access",
      id: user.id,
      role: user.role,
    });
    const refreshToken = generateToken({
      tokenType: "refresh",
      id: user.id,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: { accessToken, refreshToken },
    });
  };

  googleLogin = async (req: Request, res: Response, next: NextFunction) => {
    const googleLoginDTO: authDTO.IGoogleLoginDTO = req.body;
  };

  forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
    // forget password logic
    const { email } = req.body;
    const user = await this.userRepository.userExists({ email });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    user.otp = generateOTP(); // generate new OTP
    user.otpExpiryAt = generateExpiryTime(10); // OTP valid for 10 minutes
    await user.save(); // save the user with new OTP
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    // reset password logic
    const resetPasswordDTO: authDTO.IResetPasswordDTO = req.body;
    const user = await this.userRepository.userExists({
      email: resetPasswordDTO.email,
    });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (user.otp !== resetPasswordDTO.otp) {
      throw new BadRequestError("Invalid OTP");
    }
    if (user.otpExpiryAt && user.otpExpiryAt < new Date()) {
      throw new BadRequestError("OTP has expired");
    }
    // reset password
    await this.userRepository.update(
      { _id: user._id },
      {
        password: hashPassword(resetPasswordDTO.newPassword),
        credentialUpdatedAt: new Date(),
        $unset: { otp: 1, otpExpiryAt: 1 }, // remove otp and otpExpiryAt fields
      }
    );
    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully, you can now login with your new password",
    });
  };
}

export default new AuthService();
