import type { RequestHandler } from "express";
import { verifyAuthToken } from "../utils/jwt.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const authorization = req.header("authorization");
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const user = verifyAuthToken(match[1]);
  if (!user) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
    return;
  }

  req.user = user;
  next();
};
