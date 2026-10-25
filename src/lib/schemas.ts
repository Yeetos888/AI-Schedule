import { z } from 'zod';

export const quickAddSchema = z.object({
  type: z.enum(['event', 'task']).default('event'),
  title: z.string().min(1, 'Title cannot be empty'),
  start: z.string().optional(),
  end: z.string().optional(),
  due: z.string().optional(),
  priority: z.enum(['low', 'med', 'high']).default('med'),
  estimateMin: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export type QuickAddSchemaType = z.infer<typeof quickAddSchema>;

export const timeBlockItemSchema = z.object({
  taskId: z.string().min(1),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?/, 'Must be an ISO datetime string'),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?/, 'Must be an ISO datetime string'),
  reason: z.string().optional(),
});

export const dayPlannerSchema = z.object({
  schedule: z.array(timeBlockItemSchema),
  summary: z.string().optional(),
  advice: z.string().optional(),
});

export type DayPlannerSchemaType = z.infer<typeof dayPlannerSchema>;

export const weeklySummarySchema = z.object({
  headline: z.string(),
  keyPriorities: z.array(z.string()),
  workloadAssessment: z.string(),
  overdueWarnings: z.array(z.string()).optional(),
  actionableTips: z.array(z.string()),
});

export type WeeklySummarySchemaType = z.infer<typeof weeklySummarySchema>;
