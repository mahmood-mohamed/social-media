import jwt, { JwtPayload } from "jsonwebtoken";
import { UserRoles } from "../common/enums/index";
import { devConfig } from "../../config/env/dev.config";
import { ObjectId } from "mongoose";

interface ITokenParams {
  tokenType: "refresh" | "access";
  id: ObjectId;
  role: `${UserRoles}`;
}

export const generateToken = ({
  tokenType,
  id,
  role,
}: ITokenParams): string => {
  if (tokenType === "refresh") {
    return jwt.sign({ id, role }, devConfig.refreshTokenSecret, {
      expiresIn: "7d",
    });
  } else if (tokenType === "access") {
    return jwt.sign({ id, role }, devConfig.accessTokenSecret, {
      expiresIn: "1d",
    });
  } else {
    throw new Error("Invalid token type");
  }
};

export const verifyToken = (
  token: string,
  tokenType: "refresh" | "access"
): JwtPayload => {
  if (tokenType === "access") {
    return jwt.verify(token, devConfig.accessTokenSecret) as JwtPayload;
  } else if (tokenType === "refresh") {
    return jwt.verify(token, devConfig.refreshTokenSecret) as JwtPayload;
  }
  throw new Error("Invalid token type"); // fallback safety
};
