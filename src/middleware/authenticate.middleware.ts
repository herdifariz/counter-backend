import type { Request, Response, NextFunction } from "express";
import { UVerifyToken } from "../utils/jwt.utils.js";
import { PrismaClient } from "@prisma/client";
import { decode } from "punycode";

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

    const decoded = await UVerifyToken(token);

    // const admin = await prisma.admin.findUnique({
    //   where: { id: (decoded as typeof req.admin).id, deletedAt: null, isActive: true },
    // });

    if (req.admin) {
      req.admin = decoded as typeof req.admin;
    }

    next();
  } catch (error) {
    next(Error("Unauthorized"));
  }
};
