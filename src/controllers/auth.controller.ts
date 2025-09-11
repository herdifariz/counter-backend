import { PrismaClient } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { SLogin } from "../services/auth.services.js";

const prisma = new PrismaClient();

export const CLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body;
    const result = await SLogin(username, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
