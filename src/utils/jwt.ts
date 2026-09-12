import jwt from "jsonwebtoken";
import { AuthPayload } from "../types/auth.types";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
};

export const generateToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as jwt.SignOptions["expiresIn"],
  });
};

export const verifyToken = (token: string): AuthPayload => {
  const decoded = jwt.verify(token, getJwtSecret());

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof decoded.userId !== "string" ||
    typeof decoded.email !== "string" ||
    (decoded.role !== "admin" && decoded.role !== "staff")
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
  };
};