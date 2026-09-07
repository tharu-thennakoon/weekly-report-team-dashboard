import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/project.service.js';
import { sendSuccess } from '../utils/response.js';

export const getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const onlyActive = req.query.active === 'true';
    const projects = await projectService.getAllProjects(onlyActive);
    sendSuccess(res, projects, 'Projects retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const project = await projectService.getProjectById(id);
    sendSuccess(res, project, 'Project retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.createProject(req.body);
    sendSuccess(res, project, 'Project created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const project = await projectService.updateProject(id, req.body);
    sendSuccess(res, project, 'Project updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const result = await projectService.deleteProject(id);
    sendSuccess(res, result, 'Project deleted or deactivated successfully');
  } catch (error) {
    next(error);
  }
};
