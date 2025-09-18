import type { NextFunction, Request, Response } from "express";
import {
  SClaimQueue,
  SNextQueue,
  SCreateQueue,
  SDeleteQueue,
  SGetAllQueues,
  SGetQueueDetails,
  SReleaseQueue,
  SUpdateQueue,
} from "../services/queue.services.js";

export const CGetAllQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await SGetAllQueues();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CGetQueueDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await SGetQueueDetails(Number(req.params.id));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CCreateQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { counterId, number, status } = req.body;
    const result = await SCreateQueue(counterId, number, status);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const CUpdateQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.body;
    const result = await SUpdateQueue(Number(req.params.id), status);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CDeleteQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await SDeleteQueue(Number(req.params.id));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CClaimedQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await SClaimQueue();
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const CNextQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await SNextQueue(Number(req.params.counterId));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
