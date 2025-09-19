import type { Request, Response, NextFunction } from "express";
import { UVerifyToken } from "../utils/jwt.utils.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const MAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw Error("Unauthorized");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw Error("Unauthorized");
    }

    const payload = await UVerifyToken(token);

    const user = await prisma.admin.findUnique({
      where: { id: payload.id, deletedAt: null, isActive: true },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw Error("Unauthorized");
    }

    req.user = user;

    next();
  } catch (error) {
    next(Error("Unauthorized"));
  }
};
