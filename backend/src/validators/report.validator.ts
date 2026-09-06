import { z } from 'zod';
import { Priority, TaskStatus, TimeCategory, ReviewAction, ReportStatus } from '@prisma/client';

export const taskSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, 'Task name is required'),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  plannedPercent: z.number().min(0).max(100).default(0),
  actualPercent: z.number().min(0).max(100).default(0),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.NOT_STARTED),
  plannedHours: z.number().min(0, 'Planned hours cannot be negative').default(0),
  actualHours: z.number().min(0, 'Actual hours cannot be negative').default(0),
  deliverable: z.string().optional().nullable(),
  isPlannedForNextWeek: z.boolean().optional().default(false),
});

export const blockerSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(2, 'Blocker description is required'),
  isKeyBlocker: z.boolean().optional().default(false),
});

export const achievementSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(2, 'Achievement description is required'),
  isKeyAchievement: z.boolean().optional().default(false),
});

export const timeBreakdownSchema = z.object({
  id: z.number().optional(),
  category: z.nativeEnum(TimeCategory),
  hours: z.number().min(0, 'Hours cannot be negative').default(0),
});

export const createReportSchema = z.object({
  projectId: z.number(),
  weekStart: z.string().or(z.date()).transform((val) => new Date(val)),
  weekEnd: z.string().or(z.date()).transform((val) => new Date(val)),
  notes: z.string().optional().nullable(),
  links: z.string().optional().nullable(),
  tasks: z.array(taskSchema).optional().default([]),
  blockers: z.array(blockerSchema).optional().default([]),
  achievements: z.array(achievementSchema).optional().default([]),
  timeBreakdowns: z.array(timeBreakdownSchema).optional().default([]),
}).refine((data) => data.weekStart <= data.weekEnd, {
  message: 'Week start date must be before or equal to week end date',
  path: ['weekStart'],
});

export const updateReportSchema = z.object({
  projectId: z.number().optional(),
  weekStart: z.string().or(z.date()).optional().transform((val) => val ? new Date(val) : undefined),
  weekEnd: z.string().or(z.date()).optional().transform((val) => val ? new Date(val) : undefined),
  notes: z.string().optional().nullable(),
  links: z.string().optional().nullable(),
  tasks: z.array(taskSchema).optional(),
  blockers: z.array(blockerSchema).optional(),
  achievements: z.array(achievementSchema).optional(),
  timeBreakdowns: z.array(timeBreakdownSchema).optional(),
});

export const reviewReportSchema = z.object({
  action: z.nativeEnum(ReviewAction),
  comment: z.string().min(1, 'Review comment is required'),
}).refine((data) => {
  if (data.action === ReviewAction.CHANGES_REQUESTED && (!data.comment || data.comment.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'A detailed review comment is required when requesting changes',
  path: ['comment'],
});

export const reportQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  status: z.nativeEnum(ReportStatus).optional(),
  projectId: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  userId: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  search: z.string().optional(),
  weekStart: z.string().optional(),
  weekEnd: z.string().optional(),
});
