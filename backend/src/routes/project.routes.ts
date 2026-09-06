import { Router } from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/project.controller.js';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';
import { Role } from '@prisma/client';

const router = Router();

// Apply auth to all project routes
router.use(authenticateUser);

// All authenticated users can view projects
router.get('/', getAllProjects);
router.get('/:id', getProjectById);

// Admin & Manager can manage projects
router.post('/', requireRole([Role.ADMIN, Role.MANAGER]), validateBody(createProjectSchema), createProject);
router.patch('/:id', requireRole([Role.ADMIN, Role.MANAGER]), validateBody(updateProjectSchema), updateProject);
router.delete('/:id', requireRole([Role.ADMIN, Role.MANAGER]), deleteProject);

export default router;
