import type { NextFunction, Request, Response } from "express";
import {
  SLogin,
  SCreate,
  SUpdate,
  SDelete,
} from "../services/auth.services.js";
import { log } from "console";

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

export const CCreate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, email, name, password } = req.body;
    const result = await SCreate(username, email, name, password);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const CUpdate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, email, name, password } = req.body;
    log(req.body);
    const result = await SUpdate(Number(id), username, email, name, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CDelete = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await SDelete(Number(id));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
