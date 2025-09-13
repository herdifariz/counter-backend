import { Request, Response, NextFunction } from "express";
import {
  SClaimQueue,
  SReleaseQueue,
  SGetCurrentQueues,
  SNextQueue,
  SSkipQueue,
  SResetQueues,
} from "../services/queue.service";

export const CClaimQueue = async (
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

export const CReleaseQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { queue_number, counter_id } = req.body;

    const result = await SReleaseQueue(queue_number, counter_id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CGetCurrentQueues = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await SGetCurrentQueues();

    res.status(200).json(result);
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
    const { counter_id } = req.body;

    const result = await SNextQueue(counter_id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CSkipQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { counter_id } = req.body;

    const result = await SSkipQueue(counter_id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CResetQueues = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { counter_id } = req.body;

    const result = await SResetQueues(counter_id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
