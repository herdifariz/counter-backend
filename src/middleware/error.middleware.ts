import type { NextFunction, Request, Response } from "express";
import type { IGlobalResponse } from "../interface/global.interface.js";

export const MErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log("Error: ", err);

  const isDev = process.env.NODE_ENV !== "production";

  if (err instanceof Error) {
    const response: IGlobalResponse = {
      status: false,
      message: err.message,
    };

    const errorObj: any = { message: err.message };

    if (isDev && err.stack) {
      errorObj.detail = err.stack;
    }

    response.error = errorObj;

    res.status(400).json(response);
  } else {
    const response: IGlobalResponse = {
      status: false,
      message: "An unexpected error occurred",
      error: {
        message: "Internal Server Error",
        ...(isDev && { detail: (err as Error).stack }),
      },
    };

    res.status(500).json(response);
  }
};
