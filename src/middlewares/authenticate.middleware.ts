import { Request, Response, NextFunction } from "express";
import { UVerifyToken } from "../utils/jwt";
import { AppError } from "../errors/AppError";

// Extend Express Request to include admin property
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: number;
        username: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const MAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw AppError.unauthorized();
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw AppError.unauthorized();
    }

    const decoded = UVerifyToken(token);
    req.admin = decoded;

    next();
  } catch (error) {
    next(AppError.unauthorized());
  }
};
