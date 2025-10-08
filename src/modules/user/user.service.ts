import { NextFunction, Request, Response } from "express";
import { UserRepository } from "../../DB";
import { BadRequestError, compareHash, generateExpiryTime, generateHash, generateOTP, IUser, NotFoundError, otpEmailTemplate, sendMail } from "../../utils";
import { IUpdateLoggedInUserPasswordDTO, updateUserEmailDTO } from "./user.dto";

class UserService {
  private readonly userRepository = new UserRepository();
  constructor() {}

  getProfileById = async (req: Request, res: Response): Promise<Response> => {
    const user = await this.userRepository.findOne(
      { _id: req.params.id },  // filtering by user ID
      {
        password: 0,
        credentialUpdatedAt: 0,
        isVerified: 0,
        userAgent: 0,
        isActive: 0,
        role: 0,
        otp: 0,
        otpExpiryAt: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
      } // exclude these fields
    );

    if (!user) {
      throw new NotFoundError("User not found");
    }
    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  };

  searchUsers = async (req: Request, res: Response): Promise<Response> => {
    const { query } = req.query as { query: string };

    const regex = new RegExp(query, "i"); // 'i' flag for case-insensitive search

    const users = await this.userRepository.find(
      {
        $or: [
          { firstName: { $regex: regex } },
          { lastName: { $regex: regex } },
        ],
      },
      {
        _id: 1,
        firstName: 1,
        lastName: 1,
        fullName: 1,
        // profilePictureUrl: 1, // TODO: Add profilePictureUrl
      },
      {
        limit: 10,
      }
    );
    if (!users || users.length === 0) {
      throw new NotFoundError("User not found");
    }
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  };

  updateLoggedInUserPassword = async (req: Request, res: Response): Promise<Response> => {
    const updatePasswordDTO: IUpdateLoggedInUserPasswordDTO = req.body;
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

  updateEmail = async (req: Request, res: Response): Promise<Response> => {
    const user = req.user as IUser;
    const { email } = req.body;

    const existingUser = await this.userRepository.findOne({
      email: email,
    });
    if (existingUser) {
      throw new BadRequestError("Email already exists or the same email");
    }
    if (user.otpOldEmail && user.otpNewEmail) {
      throw new BadRequestError("OTP not expired yet");
    }
    const otpOldEmail = generateOTP();
    const otpNewEmail = generateOTP();

    await this.userRepository.update(
      { _id: user._id },
      { 
        $set:{
          otpOldEmail: await generateHash(otpOldEmail),
          otpNewEmail: await generateHash(otpNewEmail),
          otpExpiryAt: generateExpiryTime(),
          tempEmail: email
        }
      }
    );
    // send OTP to old email and new email
    sendMail({
      to: user.email,
      subject: "Verify your old email",
      html: otpEmailTemplate(otpOldEmail, user.firstName),
    })
    sendMail({
      to: email,
      subject: "Verify your new email",
      html: otpEmailTemplate(otpNewEmail, user.firstName),
    })
    return res.status(200).json({
      success: true,
      message: "Sent OTP to your old email and new email",
    });
  };

  updateUserEmail = async (req: Request, res: Response): Promise<Response> => {
    const user = req.user as IUser;
    const { otpOldEmail, otpNewEmail }: updateUserEmailDTO = req.body;
    if (!user.otpNewEmail && !user.otpOldEmail) {
      throw new BadRequestError("OTP not sent yet");
    }
    if (user.otpExpiryAt && user.otpExpiryAt < new Date()) {
      throw new BadRequestError("OTP is expired");
    }

    if (!(await compareHash(otpOldEmail, user.otpOldEmail as string))) {
      throw new BadRequestError("OTP not matched");
    }
    if (!(await compareHash(otpNewEmail, user.otpNewEmail as string))) {
      throw new BadRequestError("OTP not matched");
    }

    await this.userRepository.update(
      { _id: user._id },
      {
        email: user.tempEmail as string,
        credentialUpdatedAt: new Date(),
        $unset: {
          otpOldEmail: 1,
          otpNewEmail: 1,
          tempEmail: 1,
          otpExpiryAt: 1
        },
      }    
    );
    return res.status(200).json(
      {
        success: true,
        message: "Email updated successfully, please login again with new email",
      }
    )
  };

  is2faEnabled = async (req: Request, res: Response): Promise<Response> => {
    const user = req.user as IUser;

    if (user.is2faEnabled) {
      throw new BadRequestError("2FA is already enabled");
    }
    if(user.otpExpiryAt && user.otpExpiryAt > new Date()) {
      throw new BadRequestError("OTP not expired yet");
    }
    const otp = generateOTP();
    await this.userRepository.update(
      {
        _id: user._id,
      },
      {
        $set: {
          otp: await generateHash(otp),
          otpExpiryAt: generateExpiryTime(),
        },
      }
    );
    sendMail({
      to: user.email,
      subject: "Verify your account to enable 2FA",
      html: otpEmailTemplate(otp, user.firstName),
    });

    return res.status(200).json({
      success: true,
      message: "Sent OTP to your email to enable 2FA",
    });
  };

  enable2fa = async (req: Request, res: Response): Promise<Response> => {
    const user = req.user as IUser;
    const { otp } = req.body as { otp: string};
    if (user.otpExpiryAt && user.otpExpiryAt < new Date()) {
      throw new BadRequestError("OTP is expired");
    }
    if (!(await compareHash(otp, user.otp as string))) {
      throw new BadRequestError("OTP not matched");
    }
    await this.userRepository.update(
      {
        _id: user._id,
      },
      {
        $set: {
          is2faEnabled: true,
          $unset: {
            otp: 1,
            otpExpiryAt: 1,
          },
        },
      }
    );
    return res.status(200).json({
      success: true,
      message: "2FA enabled successfully",
    });
  };

  disable2fa = async (req: Request, res: Response): Promise<Response> => {
    const user = req.user as IUser;
    if (!user.is2faEnabled) {
      throw new BadRequestError("2FA is not enabled");
    }
    await this.userRepository.update(
      {
        _id: user._id,
      },
      {
        $set: {
          is2faEnabled: false,
        },
      }
    );
    return res.status(200).json({
      success: true,
      message: "2FA disabled successfully",
    });
  };
}

export default new UserService();
