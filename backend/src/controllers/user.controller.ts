import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';
import { Role } from '@prisma/client';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string | undefined;
    const role = req.query.role as Role | undefined;
    const users = await userService.getAllUsers(search, role);
    sendSuccess(res, users, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const user = await userService.getUserById(id);
    sendSuccess(res, user, 'User details retrieved');
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const user = await userService.updateUserRole(id, req.body.role);
    sendSuccess(res, user, 'User role updated successfully');
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const user = await userService.updateUserStatus(id, req.body.isActive);
    sendSuccess(res, user, 'User active status updated');
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const user = await userService.updateProfile(userId, req.body);
    sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};
