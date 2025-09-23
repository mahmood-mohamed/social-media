import { NextFunction, Request, Response } from "express";
import { UserRepository } from "../../DB";
import { NotFoundError } from "../../utils";

class UserService {
  private readonly userRepository = new UserRepository();
  constructor() {}

  getProfileById = async (req: Request, res: Response, next: NextFunction) => {
    const user = await this.userRepository.findOne(
      { _id: req.params.id },  // filtering by user ID
      {
        password: 0,
        credentialUpdatedAt: 0,
        isVerified: 0,
        userAgent: 0,
        role: 0,
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
}

export default new UserService();
