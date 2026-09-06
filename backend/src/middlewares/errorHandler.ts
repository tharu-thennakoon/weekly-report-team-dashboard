import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred.';

  // Log detailed error in development
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${statusCode}:`, err);
  }

  // Handle Prisma specific unique constraint violation
  if (err.code === 'P2002') {
    sendError(res, 'A record with this value already exists.', 409);
    return;
  }

  // Handle Prisma record not found
  if (err.code === 'P2025') {
    sendError(res, 'Requested record was not found.', 404);
    return;
  }

  sendError(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? err.stack : undefined
  );
};
