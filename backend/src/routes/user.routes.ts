import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  updateProfile,
} from '../controllers/user.controller.js';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';
import { validateBody, validateParams } from '../middlewares/validate.middleware.js';
import {
  updateUserRoleSchema,
  updateUserStatusSchema,
  updateProfileSchema,
} from '../validators/user.validator.js';
import { idParamSchema } from '../validators/report.validator.js';
import { Role } from '@prisma/client';

const router = Router();

// Apply auth to all user routes
router.use(authenticateUser);

// Profile update for authenticated user
router.patch('/profile', validateBody(updateProfileSchema), updateProfile);

// Admin & Manager can list users
router.get('/', requireRole([Role.MANAGER, Role.ADMIN]), getAllUsers);

// Admin & Manager can view user details
router.get('/:id', requireRole([Role.MANAGER, Role.ADMIN]), validateParams(idParamSchema), getUserById);

// Admin only: Role and Status management
router.patch('/:id/role', requireRole(Role.ADMIN), validateParams(idParamSchema), validateBody(updateUserRoleSchema), updateUserRole);
router.patch('/:id/status', requireRole(Role.ADMIN), validateParams(idParamSchema), validateBody(updateUserStatusSchema), updateUserStatus);

export default router;
