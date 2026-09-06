import { z } from 'zod';

export const chatSchema = z
  .object({
    message: z
      .string({ message: 'Message is required' })
      .trim()
      .min(1, 'Message cannot be empty')
      .max(1000, 'Message cannot exceed 1000 characters'),
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
  })
  .refine(
    (data) => {
      if (data.weekStart && data.weekEnd) {
        return new Date(data.weekStart) <= new Date(data.weekEnd);
      }
      return true;
    },
    {
      message: 'weekStart cannot be after weekEnd',
      path: ['weekStart'],
    }
  );

export type ChatInput = z.infer<typeof chatSchema>;
