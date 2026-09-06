import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response.js';

/**
 * Validates request body against a Zod schema
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = (error as any).issues?.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })) || error.message;
        sendError(res, 'Validation failed for request body.', 400, formattedErrors);
        return;
      }
      sendError(res, 'Malformed request data.', 400);
    }
  };
};

/**
 * Validates request query parameters against a Zod schema
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = (error as any).issues?.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })) || error.message;
        sendError(res, 'Validation failed for query parameters.', 400, formattedErrors);
        return;
      }
      sendError(res, 'Malformed query parameters.', 400);
    }
  };
};
