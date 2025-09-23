import { ZodType } from "zod";
import { BadRequestError } from "../utils";
import { NextFunction, Request, Response } from "express";


export const isValid = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = { ...req.body, ...req.params, ...req.query };  // Merge all possible sources of data
    const result = schema.safeParse(data);
    if (!result.success) {
      const messageDetails = result.error.issues.map((error) => {
        return {
          field: error.path[0],
          message: error.message,
        };
      });
      throw new BadRequestError("Validation Error", messageDetails);
    }
    next();
  };
};
