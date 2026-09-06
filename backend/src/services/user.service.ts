import prisma from '../config/prisma.js';
import { Role } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password.js';

export class UserService {
  /**
   * List all users with summary stats
   */
  async getAllUsers(search?: string, role?: Role) {
    return prisma.user.findMany({
      where: {
        ...(role && { role }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { reports: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get single user with report history summary
   */
  async getUserById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        reports: {
          take: 10,
          orderBy: { weekStart: 'desc' },
          include: {
            project: { select: { id: true, name: true } },
            _count: { select: { tasks: true } },
          },
        },
      },
    });

    if (!user) {
      const error: any = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  /**
   * Update user role (Admin only)
   */
  async updateUserRole(id: number, role: Role) {
    return prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  }

  /**
   * Update user active status (Admin only)
   */
  async updateUserStatus(id: number, isActive: boolean) {
    return prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  }

  /**
   * Update profile (name or password)
   */
  async updateProfile(userId: number, data: { name?: string; currentPassword?: string; newPassword?: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const error: any = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    let updatedHash: string | undefined;

    if (data.newPassword) {
      if (!data.currentPassword) {
        const error: any = new Error('Current password is required to set a new password.');
        error.statusCode = 400;
        throw error;
      }

      const isMatch = await comparePassword(data.currentPassword, user.passwordHash);
      if (!isMatch) {
        const error: any = new Error('Current password does not match.');
        error.statusCode = 400;
        throw error;
      }

      updatedHash = await hashPassword(data.newPassword);
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(updatedHash && { passwordHash: updatedHash }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }
}

export const userService = new UserService();
