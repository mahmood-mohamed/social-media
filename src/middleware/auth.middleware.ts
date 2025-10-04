import { NextFunction, Request, Response } from "express";
import { NotFoundError, UnauthorizedError, verifyToken } from "../utils";
import { UserRepository } from "../DB/model/user/user.repository";

export const isAuthenticated = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    const payload = verifyToken(token as string, "access");
    if (!payload) {
      return new UnauthorizedError("Unauthorized");
    }
    const userRepository = new UserRepository();
    const user = await userRepository.findOne({ _id: payload.id });
    if (!user) {
      return new NotFoundError("User not found");
    }
    // check if password was changed after token was issued
    const credentialsUpdatedAt = Math.floor(user.credentialUpdatedAt.getTime() / 1000);
    if (payload.iat && payload.iat < credentialsUpdatedAt) {
      return next(new UnauthorizedError("Token expired after password change, please login again"));
    }
    
    req.user = user;
    next();
  };
};
