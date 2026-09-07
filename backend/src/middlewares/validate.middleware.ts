import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';
import { sendError } from '../utils/response.js';

interface FormattedValidationError {
  field: string;
  message: string;
}

const formatZodIssues = (issues: ZodIssue[]): FormattedValidationError[] => {
  return issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
};

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
        const formattedErrors = formatZodIssues(error.issues);
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
        const formattedErrors = formatZodIssues(error.issues);
        sendError(res, 'Validation failed for query parameters.', 400, formattedErrors);
        return;
      }
      sendError(res, 'Malformed query parameters.', 400);
    }
  };
};

/**
 * Validates request route parameters against a Zod schema
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = formatZodIssues(error.issues);
        sendError(res, 'Validation failed for route parameters.', 400, formattedErrors);
        return;
      }
      sendError(res, 'Malformed route parameters.', 400);
    }
  };
};
