import { Router } from 'express';
import { handleChat } from '../controllers/ai.controller.js';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { chatSchema } from '../validators/ai.validator.js';
import { Role } from '@prisma/client';

const router = Router();

// Manager and Admin only endpoint for AI Assistant
router.use(authenticateUser);
router.use(requireRole([Role.MANAGER, Role.ADMIN]));

router.post('/chat', validateBody(chatSchema), handleChat);
router.post('/query', validateBody(chatSchema), handleChat);

export default router;
