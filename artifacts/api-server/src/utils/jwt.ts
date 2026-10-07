import jwt, { type JwtPayload } from "jsonwebtoken";
import {
  JWT_AUDIENCE,
  JWT_EXPIRES_IN,
  JWT_ISSUER,
  JWT_SECRET,
} from "../config/jwt.js";

export interface AuthTokenPayload {
  id: string;
  email: string;
}

export function createAuthToken(user: AuthTokenPayload): string {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    {
      algorithm: "HS256",
      audience: JWT_AUDIENCE,
      expiresIn: JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
    },
  );
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
    });

    if (
      typeof decoded === "string" ||
      typeof (decoded as JwtPayload).id !== "string" ||
      typeof (decoded as JwtPayload).email !== "string"
    ) {
      return null;
    }

    return {
      id: (decoded as JwtPayload).id as string,
      email: (decoded as JwtPayload).email as string,
    };
  } catch {
    return null;
  }
}
