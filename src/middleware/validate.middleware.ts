import type { Request, Response, NextFunction } from "express";
import Joi from "joi";

type RequestPart = "body" | "params" | "query";

export const MValidate =
  (schema: Joi.ObjectSchema, property: RequestPart = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req[property], { abortEarly: false });

    if (error) {
      const validationError = error.details.map((detail) => {
        return new Error(detail.message);
      })[0];

      return next(validationError);
    }

    next();
  };
