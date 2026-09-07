import { Request, Response, NextFunction } from 'express';
import { reportService, ReportQueryFilters } from '../services/report.service.js';
import { sendSuccess } from '../utils/response.js';

export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = req.query as unknown as ReportQueryFilters;
    const result = await reportService.getReports(filters);
    sendSuccess(res, result, 'Reports retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getMyReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const reports = await reportService.getMyReports(userId);
    sendSuccess(res, reports, 'My reports retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getReportById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const report = await reportService.getReportById(id, req.user!);
    sendSuccess(res, report, 'Report retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const report = await reportService.createReport(userId, req.body);
    sendSuccess(res, report, 'Report draft created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user!.userId;
    const report = await reportService.updateReport(id, userId, req.body);
    sendSuccess(res, report, 'Report updated successfully');
  } catch (error) {
    next(error);
  }
};

export const submitReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user!.userId;
    const report = await reportService.submitReport(id, userId);
    sendSuccess(res, report, 'Report submitted successfully for manager review');
  } catch (error) {
    next(error);
  }
};

export const reviewReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const reviewerId = req.user!.userId;
    const result = await reportService.reviewReport(id, reviewerId, req.body);
    sendSuccess(res, result, 'Report review completed successfully');
  } catch (error) {
    next(error);
  }
};

export const getReportVersions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const versions = await reportService.getReportVersions(id, req.user!);
    sendSuccess(res, versions, 'Report versions retrieved successfully');
  } catch (error) {
    next(error);
  }
};
