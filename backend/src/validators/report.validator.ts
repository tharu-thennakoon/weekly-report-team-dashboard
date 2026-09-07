import { z } from 'zod';
import { Priority, TaskStatus, TimeCategory, ReviewAction, ReportStatus } from '@prisma/client';
import { parseDateOnly, parseDateOnlyEnd } from '../utils/date.js';

export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID must be a positive integer')
    .transform((val) => {
      const num = parseInt(val, 10);
      if (isNaN(num) || num <= 0) {
        throw new Error('Invalid ID parameter');
      }
      return num;
    }),
});

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

// Reusable validation for key blockers and key achievements
const validateKeyItems = (blockers?: { isKeyBlocker?: boolean }[], achievements?: { isKeyAchievement?: boolean }[]) => {
  if (blockers) {
    const keyBlockersCount = blockers.filter((b) => b.isKeyBlocker === true).length;
    if (keyBlockersCount > 1) {
      return { valid: false, field: 'blockers', message: 'Only one key blocker can be selected per report.' };
    }
  }
  if (achievements) {
    const keyAchievementsCount = achievements.filter((a) => a.isKeyAchievement === true).length;
    if (keyAchievementsCount > 1) {
      return { valid: false, field: 'achievements', message: 'Only one key achievement can be selected per report.' };
    }
  }
  return { valid: true };
};

export const createReportSchema = z
  .object({
    projectId: z.number({ message: 'Project ID is required' }).int().positive(),
    weekStart: z
      .string()
      .or(z.date())
      .transform((val) => parseDateOnly(val)),
    weekEnd: z
      .string()
      .or(z.date())
      .transform((val) => parseDateOnlyEnd(val)),
    notes: z.string().optional().nullable(),
    links: z.string().optional().nullable(),
    tasks: z.array(taskSchema).optional().default([]),
    blockers: z.array(blockerSchema).optional().default([]),
    achievements: z.array(achievementSchema).optional().default([]),
    timeBreakdowns: z.array(timeBreakdownSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.weekStart > data.weekEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Week start date must be before or equal to week end date',
        path: ['weekStart'],
      });
    }

    const keyCheck = validateKeyItems(data.blockers, data.achievements);
    if (!keyCheck.valid && keyCheck.field) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: keyCheck.message || 'Validation error',
        path: [keyCheck.field],
      });
    }
  });

export const updateReportSchema = z
  .object({
    projectId: z.number().int().positive().optional(),
    weekStart: z
      .string()
      .or(z.date())
      .optional()
      .transform((val) => (val ? parseDateOnly(val) : undefined)),
    weekEnd: z
      .string()
      .or(z.date())
      .optional()
      .transform((val) => (val ? parseDateOnlyEnd(val) : undefined)),
    notes: z.string().optional().nullable(),
    links: z.string().optional().nullable(),
    tasks: z.array(taskSchema).optional(),
    blockers: z.array(blockerSchema).optional(),
    achievements: z.array(achievementSchema).optional(),
    timeBreakdowns: z.array(timeBreakdownSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.weekStart && data.weekEnd && data.weekStart > data.weekEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Week start date must be before or equal to week end date',
        path: ['weekStart'],
      });
    }

    const keyCheck = validateKeyItems(data.blockers, data.achievements);
    if (!keyCheck.valid && keyCheck.field) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: keyCheck.message || 'Validation error',
        path: [keyCheck.field],
      });
    }
  });

export const reviewReportSchema = z
  .object({
    action: z.nativeEnum(ReviewAction),
    comment: z.string().min(1, 'Review comment is required'),
  })
  .refine(
    (data) => {
      if (data.action === ReviewAction.CHANGES_REQUESTED && (!data.comment || data.comment.trim().length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'A detailed review comment is required when requesting changes',
      path: ['comment'],
    }
  );

export const reportQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .refine((val) => !val || (/^\d+$/.test(val) && parseInt(val, 10) >= 1), {
      message: 'Page must be a positive integer',
    })
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .refine((val) => !val || (/^\d+$/.test(val) && parseInt(val, 10) >= 1 && parseInt(val, 10) <= 100), {
      message: 'Limit must be an integer between 1 and 100',
    })
    .transform((val) => (val ? parseInt(val, 10) : 10)),
  status: z.nativeEnum(ReportStatus).optional(),
  projectId: z
    .string()
    .optional()
    .refine((val) => !val || (/^\d+$/.test(val) && parseInt(val, 10) >= 1), {
      message: 'Project ID must be a positive integer',
    })
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  userId: z
    .string()
    .optional()
    .refine((val) => !val || (/^\d+$/.test(val) && parseInt(val, 10) >= 1), {
      message: 'User ID must be a positive integer',
    })
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  search: z.string().optional(),
  weekStart: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid weekStart date format',
    }),
  weekEnd: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid weekEnd date format',
    }),
});

export const dashboardQuerySchema = z.object({
  weekStart: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid weekStart date format',
    }),
  weekEnd: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid weekEnd date format',
    }),
  date: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type ReviewReportInput = z.infer<typeof reviewReportSchema>;
export type ReportQueryParams = z.infer<typeof reportQuerySchema>;
export type DashboardQueryParams = z.infer<typeof dashboardQuerySchema>;
