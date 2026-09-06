import { Router } from 'express';
import {
  getMemberDashboard,
  getManagerDashboard,
  getWeeklyOverview,
} from '../controllers/dashboard.controller.js';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateUser);

// Member personal dashboard
router.get('/member', getMemberDashboard);

// Manager / Admin dashboard analytics
router.get('/manager', requireRole([Role.MANAGER, Role.ADMIN]), getManagerDashboard);

// Manager / Admin weekly overview matrix
router.get('/overview', requireRole([Role.MANAGER, Role.ADMIN]), getWeeklyOverview);

export default router;
