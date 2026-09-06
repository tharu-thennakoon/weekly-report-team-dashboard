import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service.js';
import { sendSuccess } from '../utils/response.js';

/**
 * Handle AI assistant chat query from Manager or Admin
 */
export const handleChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, weekStart, weekEnd } = req.body;

    const result = await aiService.processChat({
      message,
      weekStart,
      weekEnd,
    });

    sendSuccess(res, result, 'AI response generated successfully');
  } catch (error) {
    next(error);
  }
};
