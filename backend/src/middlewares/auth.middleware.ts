import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';

import prisma from '../config/prisma.js';

/**
 * Authentication Middleware:
 * Extracts Bearer token from the Authorization header, validates JWT signature,
 * fetches the CURRENT user record from MySQL to verify active status and load current role.
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication required. No token provided.', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    
    // Fetch current user state from database to guard against stale tokens, deactivated users, or modified roles
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      sendError(res, 'User account not found.', 401);
      return;
    }

    if (!user.isActive) {
      sendError(res, 'User account is deactivated.', 403);
      return;
    }

    // Attach fresh database user record with current DB role
    req.user = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    sendError(res, 'Invalid or expired token.', 401);
  }
};

/**
 * Role-Based Access Control (RBAC) Middleware:
 * Verifies that the authenticated user has one of the allowed roles.
 */
export const requireRole = (allowedRoles: Role | Role[]) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Unauthenticated request.', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(
        res,
        `Forbidden: Access denied. Required role(s): ${roles.join(', ')}`,
        403
      );
      return;
    }

    next();
  };
};
