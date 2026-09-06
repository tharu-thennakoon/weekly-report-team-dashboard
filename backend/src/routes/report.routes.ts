import { Router } from 'express';
import {
  getReports,
  getMyReports,
  getReportById,
  createReport,
  updateReport,
  submitReport,
  reviewReport,
  getReportVersions,
} from '../controllers/report.controller.js';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';
import { validateBody, validateQuery } from '../middlewares/validate.middleware.js';
import {
  createReportSchema,
  updateReportSchema,
  reviewReportSchema,
  reportQuerySchema,
} from '../validators/report.validator.js';
import { Role } from '@prisma/client';

const router = Router();

// Require authentication on all report endpoints
router.use(authenticateUser);

// List authenticated user's own reports
router.get('/me', getMyReports);

// Manager / Admin list all reports with filtering & pagination
router.get('/', requireRole([Role.MANAGER, Role.ADMIN]), validateQuery(reportQuerySchema), getReports);

// Create a new draft report
router.post('/', validateBody(createReportSchema), createReport);

// Get single report (ownership or manager/admin checked in service)
router.get('/:id', getReportById);

// Update a draft or needs_correction report
router.put('/:id', validateBody(updateReportSchema), updateReport);

// Submit / Resubmit report (creates version snapshot)
router.post('/:id/submit', submitReport);

// Manager / Admin: Review report (Approve or Request Changes)
router.post('/:id/review', requireRole([Role.MANAGER, Role.ADMIN]), validateBody(reviewReportSchema), reviewReport);

// Get version snapshots history for a report
router.get('/:id/versions', getReportVersions);

export default router;
