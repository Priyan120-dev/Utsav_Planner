import { z } from 'zod';
import { EventProfileSchema, EventStateSchema, BudgetCategorySchema } from '@utsav/shared';

export const ParseProfileReqSchema = z.object({
  freeText: z
    .string()
    .min(5, 'Description must be at least 5 characters')
    .max(5000, 'Description cannot exceed 5000 characters'),
  existingProfile: z.record(z.unknown()).optional()
});

export const BudgetTradeoffReqSchema = z.object({
  eventState: EventStateSchema,
  categoryAdjusted: BudgetCategorySchema,
  newPercentage: z.number().min(0).max(100)
});

export const GenerateTasksReqSchema = z.object({
  eventProfile: EventProfileSchema
});

export const DateShiftReqSchema = z.object({
  eventState: EventStateSchema,
  newEventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const VendorBriefReqSchema = z.object({
  eventProfile: EventProfileSchema,
  category: BudgetCategorySchema,
  allocatedBudgetINR: z.number().nonnegative()
});

export const ExtractQuoteReqSchema = z.object({
  rawText: z
    .string()
    .min(10, 'Vendor quote text is too short to analyze')
    .max(10000, 'Vendor quote text cannot exceed 10000 characters'),
  category: BudgetCategorySchema,
  guestCount: z.number().int().positive().optional()
});

export const DynamicChangeReqSchema = z.object({
  eventState: EventStateSchema,
  changeType: z.enum(['budget', 'guests', 'date']),
  newValue: z.union([z.string(), z.number()]),
  reason: z.string().max(1000, 'Reason cannot exceed 1000 characters').optional()
});
