import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/response.js';

export const getMemberDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const data = await dashboardService.getMemberDashboard(userId);
    sendSuccess(res, data, 'Member dashboard data retrieved');
  } catch (error) {
    next(error);
  }
};

export const getManagerDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { weekStart, weekEnd, date } = req.query as { weekStart?: string; weekEnd?: string; date?: string };
    const data = await dashboardService.getManagerDashboard(weekStart, weekEnd, date);
    sendSuccess(res, data, 'Manager dashboard analytics retrieved');
  } catch (error) {
    next(error);
  }
};

export const getWeeklyOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { weekStart, weekEnd, date } = req.query as { weekStart?: string; weekEnd?: string; date?: string };
    const data = await dashboardService.getWeeklyOverview(date, weekStart, weekEnd);
    sendSuccess(res, data, 'Weekly team overview retrieved');
  } catch (error) {
    next(error);
  }
};
