import jwt from "jsonwebtoken";
import { UserRoles } from "../common/enums/index";

interface ITokenParams {
  tokenType: "refresh" | "access";
  id: string;
  role: `${UserRoles}`;
}

export const generateToken = ({ tokenType, id, role }: ITokenParams) => {
  if (tokenType === "refresh") {
    return jwt.sign({ id, role }, process.env.ACCESS_TOKEN_SECRET as string, {
      expiresIn: "15m",
    });
  } else if (tokenType === "access") {
    return jwt.sign({ id, role }, process.env.REFRESH_TOKEN_SECRET as string, {
      expiresIn: "1d",
    });
  }
};

export const verifyToken = (token: string, tokenType: "refresh" | "access") => {
  try {
    if (tokenType === "refresh") {
      return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string);
    } else if (tokenType === "access") {
      return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
    }
  } catch (error) {
    return null;
  }
};
