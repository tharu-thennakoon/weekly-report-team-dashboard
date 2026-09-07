import { Router } from 'express';
import {
  getMemberDashboard,
  getManagerDashboard,
  getWeeklyOverview,
} from '../controllers/dashboard.controller.js';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';
import { validateQuery } from '../middlewares/validate.middleware.js';
import { dashboardQuerySchema } from '../validators/report.validator.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateUser);

// Member personal dashboard
router.get('/member', getMemberDashboard);

// Manager / Admin dashboard analytics
router.get('/manager', requireRole([Role.MANAGER, Role.ADMIN]), validateQuery(dashboardQuerySchema), getManagerDashboard);

// Manager / Admin weekly overview matrix
router.get('/overview', requireRole([Role.MANAGER, Role.ADMIN]), validateQuery(dashboardQuerySchema), getWeeklyOverview);

export default router;
