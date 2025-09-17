import type { NextFunction, Request, Response } from "express";
import {
  SCreateCounter,
  SDeleteCounter,
  SGetAllCounters,
  SGetCounterDetails,
  SUpdateCounter,
  SUpdateCounterStatus,
} from "../services/counter.services.js";

export const CGetAllCounters = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await SGetAllCounters();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CGetCounterDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await SGetCounterDetails(Number(id));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CCreateCounter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, maxQueue } = req.body;
    const result = await SCreateCounter(name, maxQueue);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const CUpdateCounter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, maxQueue, currentQueue } = req.body;
    const result = await SUpdateCounter(
      Number(id),
      name,
      maxQueue,
      currentQueue
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CUpdateCounterStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await SUpdateCounterStatus(Number(id), status);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CDeleteCounter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await SDeleteCounter(Number(id));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
