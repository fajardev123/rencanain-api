import { v4 as uuidv4 } from "uuid";
import { JWT_ACCESS_TOKEN, JWT_REFRESH_TOKEN } from "../config";
import jwt from "jsonwebtoken";

export const generateAccessToken = (user: any) => {
  return jwt.sign(user, JWT_ACCESS_TOKEN!, { expiresIn: "15m" });
};

export const generateRefreshToken = (user: any) => {
  const tokenId = uuidv4();
  const refreshToken = jwt.sign({ ...user, tokenId }, JWT_REFRESH_TOKEN!, {
    expiresIn: "7d",
  });

  return refreshToken;
};
