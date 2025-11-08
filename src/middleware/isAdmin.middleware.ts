import { Request, Response, NextFunction } from "express";
import { verifyToken, UnauthorizedError, NotFoundError, ForbiddenError } from "../utils";
import { UserRepository } from "../DB";

export const isAdmin = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    if (!token) {
      return next(new UnauthorizedError("Authorization token missing"));
    }

    const payload = verifyToken(token as string, "access");
    if (!payload) {
      return next(new UnauthorizedError("Invalid or expired token"));
    }

    const userRepository = new UserRepository();
    const user = await userRepository.findOne({ _id: payload.id });
    if (!user) {
      return next(new NotFoundError("User not found"));
    }

    // check if password was changed after token was issued
    const credentialsUpdatedAt = Math.floor(user.credentialUpdatedAt.getTime() / 1000);
    if (payload.iat && payload.iat < credentialsUpdatedAt) {
      return next(new UnauthorizedError("Token invalid or expired, please login again"));
    }

    // 🔒 Check admin role
    if (user.role !== "admin") {
      return next(new ForbiddenError("Access denied. Admins only."));
    }

    req.user = user;
    next();
  };
};
