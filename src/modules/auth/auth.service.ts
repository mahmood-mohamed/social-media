import type { Request, Response, NextFunction } from "express";
import * as authDTO from "./auth.dto";
import {
  BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError,
  IUser,
  TokenType,
  generateExpiryTime, generateOTP,
  generateToken, verifyToken,
  generateHash, compareHash,
  sendMail, otpEmailTemplate,
  UserAgent,
} from "../../utils";
import { TokenRepository, UserRepository } from "../../DB";
import { AuthFactoryService } from "./factory";
import { UserEntity } from "./entity";

// abstract.repository pattern
class AuthService {
  private readonly userRepository = new UserRepository();
  private readonly tokenRepository = new TokenRepository();
  private readonly authFactoryService = new AuthFactoryService();
  constructor() {}

  register = async (req: Request, res: Response): Promise<Response> => {
    const registerDTO: authDTO.IRegisterDTO = req.body;
    // check if user already exists
    const userExists = await this.userRepository.userExists({
      email: registerDTO.email,
    }); // {User Document} | null
    if (userExists) {
      throw new ConflictError("User already exists");
    }
    // create user entity from DTO
    const registerResponse = await this.authFactoryService.register(
      registerDTO
    );
    const { user: newUser, rawOtp } = registerResponse as {
      user: UserEntity;
      rawOtp: string;
    };

    // create user in DB
    const createdUser = (await this.userRepository.create(
      newUser
    )) as unknown as UserEntity;

    // send verification email
    await sendMail({
      to: createdUser.email,
      subject: "Verify your account",
      html: otpEmailTemplate(rawOtp, createdUser.firstName),
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: createdUser,
    });
  };

  verifyAccount = async (req: Request, res: Response): Promise<Response> => {
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
    // verify OTP
    if (!(await compareHash(verifyAccountDTO.otp, user.otp as string))) {
      throw new BadRequestError("Invalid OTP");
    }
    if (user.otpExpiryAt && user.otpExpiryAt < new Date()) {
      throw new BadRequestError("OTP has expired");
    }
    await this.userRepository.update(
      { _id: user._id }, // filter
      { $set: { isVerified: true }, $unset: { otp: 1, otpExpiryAt: 1 } }
    );

    return res.sendStatus(204); // No Content >> Do not return any data >> Done
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
      throw new BadRequestError("User is already verified");
    }
    if (user.otpExpiryAt && user.otpExpiryAt > new Date()) {
      throw new BadRequestError("OTP has already been sent.");
    }
    // generate new OTP and save to DB
    const rawOtp = generateOTP();
    await this.userRepository.update(
      { _id: user._id },
      {
        $set: {
          otp: await generateHash(rawOtp),
          otpExpiryAt: generateExpiryTime(),
        },
      }
    );
    // Save the updated user that has send OTP to user's email
    sendMail({
      to: user.email,
      subject: "Resend OTP - Confirm your email address",
      html: otpEmailTemplate(rawOtp, user.firstName),
    });
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  };

  login = async (req: Request, res: Response) => {
    // login logic
    const loginDTO: authDTO.ILoginDTO = req.body;
    const user = await this.userRepository.userExists({
      email: loginDTO.email,
    });
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }
    if (!user.isVerified) {
      throw new ForbiddenError(
        "User is not verified. Please check your email for a verification OTP."
      );
    }
    const isValidPassword = await compareHash(loginDTO.password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid email or password");
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

    // save refresh token in DB
    await this.tokenRepository.createToken({
      userId: user.id,
      token: refreshToken,
      type: TokenType.REFRESH,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: { accessToken, refreshToken },
    });
  };

  googleLogin = async (req: Request, res: Response) => {
    const googleLoginDTO: authDTO.IGoogleLoginDTO = req.body;
    const { user } = (await this.authFactoryService.googleLogin(googleLoginDTO)) as { user: UserEntity };
    const userExists = await this.userRepository.userExists({email: user.email});
    let existingUser: IUser;
    if (!userExists) {
      // create user in DB
      existingUser = (await this.userRepository.create(
        user
      )) as unknown as IUser;
    } else {
      // existing user
      existingUser = userExists;
    }
    const accessToken = generateToken({
      tokenType: "access",
      id: existingUser._id,
      role: existingUser.role,
    });
    const refreshToken = generateToken({
      tokenType: "refresh",
      id: existingUser._id,
      role: existingUser.role,
    });
    await this.tokenRepository.findTokenAndDelete({
      userId: existingUser._id,
      type: TokenType.REFRESH,
    });
    // save refresh token in DB
    await this.tokenRepository.createToken({
      userId: existingUser._id,
      token: refreshToken,
      type: TokenType.REFRESH,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    return res.status(200).json({
      success: true,
      message: userExists ? "User logged in successfully" : "User registered and logged in successfully",
      data: { accessToken, refreshToken },
    });
  };

  forgetPassword = async (req: Request, res: Response): Promise<Response> => {
    // forget password logic
    const { email } = req.body;
    const user = await this.userRepository.userExists({ email });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (user.userAgent === UserAgent.GOOGLE) {
      throw new BadRequestError(
        "You have registered using Google. Please use Google login to access your account."
      );
    }
    const rawOtp = generateOTP();
    await this.userRepository.update(
      { _id: user._id },
      {
        $set: {
          otp: await generateHash(rawOtp),
          otpExpiryAt: generateExpiryTime(),
        },
      }
    );

    // send OTP to user's email
    sendMail({
      to: user.email,
      subject: "Password Reset OTP",
      html: otpEmailTemplate(rawOtp, user.firstName),
    });
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
        password: await generateHash(resetPasswordDTO.newPassword),
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

  updateLoggedInUserPassword = async (req: Request, res: Response) => {
    const updatePasswordDTO: authDTO.IUpdateLoggedInUserPasswordDTO = req.body;
    const user = req.user as IUser;

    if (!(await compareHash(updatePasswordDTO.password, user.password))) {
      throw new BadRequestError("Current password is incorrect");
    }

    await this.userRepository.update(
      { _id: user._id },
      {
        password: await generateHash(updatePasswordDTO.newPassword),
        credentialUpdatedAt: new Date(),
      }
    );
    return res.status(200).json({
      success: true,
      message:
        "Password updated successfully, please login again with new password",
    });
  };

  //*⛔ logic to logout user
  logout = async (req: Request, res: Response) => {
    // logout logic
    const user = req.user as IUser;
    await this.tokenRepository.deleteMany({ userId: user._id });
    await this.userRepository.update(
      { _id: user._id },
      { $set: { credentialUpdatedAt: new Date() } } // Invalidate all existing tokens
    );
    return res.sendStatus(204); // No Content >> Do not return any data >> Done
  };

  //*🔃✅ logic to issue new access token using refresh token
  refreshToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new BadRequestError("Refresh token is required");
    }
    const payload = verifyToken(refreshToken, "refresh");
    if (!payload) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
    // Check if the user still exists
    const user = await this.userRepository.findOne({ _id: payload.id });
    if (!user) {
      throw new UnauthorizedError("User not found");
    }
    // check credentialsUpdatedAt
    const credentialsUpdatedAt = Math.floor(
      user.credentialUpdatedAt.getTime() / 1000
    );
    if (payload.iat && payload.iat < credentialsUpdatedAt) {
      throw new UnauthorizedError(
        "Token expired after password change, please login again"
      );
    }

    // Check if the token exists in DB
    const existingToken = await this.tokenRepository.findToken({
      token: refreshToken,
      userId: payload.id,
      type: TokenType.REFRESH,
    });
    if (!existingToken) {
      throw new UnauthorizedError(
        "Refresh token not found, please login again"
      );
    }

    const accessToken = generateToken({
      tokenType: "access",
      id: payload.id,
      role: payload.role,
    });
    const newRefreshToken = generateToken({
      tokenType: "refresh",
      id: payload.id,
      role: payload.role,
    });

    // save new refresh token in DB and delete old one
    await this.tokenRepository.findTokenAndDelete({ token: refreshToken });
    await this.tokenRepository.createToken({
      userId: payload.id,
      token: newRefreshToken,
      type: TokenType.REFRESH,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: { accessToken, refreshToken: newRefreshToken },
    });
  };
}

export default new AuthService();
