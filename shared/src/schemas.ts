import { z } from 'zod';

export const OccasionTypeSchema = z.enum([
  'wedding',
  'birthday',
  'community',
  'anniversary',
  'cultural_festival'
]);

export const TaskStatusSchema = z.enum(['locked', 'ready', 'in_progress', 'done']);
export const TaskPrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);

export const BudgetCategorySchema = z.enum([
  'venue',
  'catering',
  'decor',
  'photography_videography',
  'entertainment',
  'attire',
  'invitations',
  'transport',
  'miscellaneous',
  'contingency'
]);

export const CulturalRecommendationsSchema = z.object({
  themes: z.array(z.string()).default([]),
  menuDirections: z.array(z.string()).default([]),
  decorIdeas: z.array(z.string()).default([]),
  culturalNotes: z.array(z.string()).default([])
});

/**
 * Flexible string array schema that tolerates harmless variations from models
 * (e.g., returning a single string or comma-separated string instead of an array).
 */
export const FlexibleStringArraySchema: z.ZodType<string[], z.ZodTypeDef, unknown> = z.preprocess((val) => {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if (trimmed.includes(',')) {
      return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [trimmed];
  }
  if (Array.isArray(val)) {
    return val.map((v) => (typeof v === 'string' ? v.trim() : String(v))).filter(Boolean);
  }
  return val;
}, z.array(z.string()).default([]));

export const EventProfileSchema = z.object({
  occasion: OccasionTypeSchema,
  title: z.string().min(1, 'Title is required'),
  totalBudgetINR: z.coerce.number().positive('Budget must be positive'),
  expectedGuests: z.coerce.number().int().positive('Guest count must be at least 1'),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  city: z.string().min(1, 'City is required'),
  atmosphereTheme: z.string().default('Warm and celebratory'),
  culturalNeeds: FlexibleStringArraySchema,
  dietaryNeeds: FlexibleStringArraySchema,
  accessibilityNeeds: FlexibleStringArraySchema,
  mustHaves: FlexibleStringArraySchema,
  priorities: z.preprocess((val) => {
    if (Array.isArray(val) && val.length > 3) {
      return val.slice(0, 3);
    }
    return val;
  }, z.tuple([z.string(), z.string(), z.string()])),
  followUpQuestions: z.preprocess((val) => {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      return trimmed ? [trimmed] : [];
    }
    if (Array.isArray(val) && val.length > 3) {
      return val.slice(0, 3);
    }
    return val;
  }, z.array(z.string()).max(3).optional()),
  recommendations: CulturalRecommendationsSchema.optional()
});

export const BudgetCategoryItemSchema = z.object({
  category: BudgetCategorySchema,
  label: z.string(),
  allocatedAmountINR: z.number().nonnegative(),
  percentage: z.number().min(0).max(100),
  perGuestINR: z.number().nonnegative(),
  isContingency: z.boolean().optional()
});

export const BudgetTradeoffAiResponseSchema = z.object({
  explanation: z.string().min(1),
  actionableOptions: z.preprocess((val) => {
    if (Array.isArray(val) && val.length > 4) {
      return val.slice(0, 4);
    }
    return val;
  }, z.array(z.string()).min(2).max(4)),
  disclaimer: z.string().default('Estimate, not a verified vendor price.')
});

export const TaskItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: BudgetCategorySchema,
  daysBeforeEvent: z.number().int().nonnegative(),
  targetDate: z.string(),
  priority: TaskPrioritySchema,
  dependsOn: z.array(z.string()).default([]),
  status: TaskStatusSchema,
  isCriticalPath: z.boolean().optional(),
  isOverdue: z.boolean().optional(),
  isAtRisk: z.boolean().optional()
});

import { 
  EventState, 
  BudgetState, 
  TimelineState, 
  QuoteItem, 
  ChangeLogEntry,
  BudgetCategory,
  PricingTier,
  AdditionalCharge
} from './types.js';

export const BudgetStateSchema: z.ZodType<BudgetState, z.ZodTypeDef, any> = z.object({
  totalBudgetINR: z.number().nonnegative(),
  categories: z.record(BudgetCategorySchema, BudgetCategoryItemSchema) as any,
  contingencyPercent: z.number().nonnegative(),
  perGuestTotalINR: z.number().nonnegative(),
  lastAiTradeoff: BudgetTradeoffAiResponseSchema.optional()
}) as any;

export const DateShiftImpactSchema = z.object({
  previousDate: z.string(),
  newDate: z.string(),
  daysShifted: z.number(),
  unrealisticTaskIds: z.array(z.string()),
  compressionAdvice: z.string(),
  suggestedDrops: z.array(z.string())
});

export const TimelineStateSchema: z.ZodType<TimelineState, z.ZodTypeDef, any> = z.object({
  tasks: z.array(TaskItemSchema),
  eventDate: z.string(),
  hasCycles: z.boolean(),
  criticalPathTaskIds: z.array(z.string()).default([]),
  lastDateShiftImpact: DateShiftImpactSchema.optional()
}) as any;

export const ChangeLogEntrySchema: z.ZodType<ChangeLogEntry, z.ZodTypeDef, any> = z.object({
  id: z.string(),
  timestamp: z.string(),
  fieldChanged: z.enum(['budget', 'guests', 'date', 'priorities', 'custom']),
  previousValue: z.unknown().optional(),
  newValue: z.unknown().optional(),
  reason: z.string().default(''),
  impactSummary: z.string().default('')
}) as any;

export const AdditionalChargeSchema = z.object({
  item: z.string(),
  amountINR: z.number().nonnegative()
});

export const PricingTierSchema = z.object({
  upToGuests: z.number().int().positive(),
  pricePerPlate: z.number().nonnegative()
});

export const QuoteItemSchema: z.ZodType<QuoteItem, z.ZodTypeDef, any> = z.object({
  id: z.string(),
  category: BudgetCategorySchema,
  vendorName: z.string(),
  basePriceINR: z.number().nonnegative(),
  tiers: z.array(PricingTierSchema).nullable().optional().default(null),
  guestCapacity: z.number().nullable().default(null),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  additionalChargesINR: z.number().nonnegative().default(0),
  additionalChargesBreakdown: z.array(AdditionalChargeSchema).default([]),
  paymentTerms: z.string().nullable().default(null),
  cancellationPolicy: z.string().nullable().default(null),
  missingInfo: z.array(z.string()).default([]),
  redFlags: z.array(z.string()).default([]),
  computedTotalCostINR: z.number().nonnegative(),
  availabilityDisclaimer: z.string()
}) as any;

export const EventStateSchema: z.ZodType<EventState, z.ZodTypeDef, any> = z.object({
  version: z.number().default(1),
  id: z.string(),
  profile: EventProfileSchema,
  budget: BudgetStateSchema,
  timeline: TimelineStateSchema,
  vendorBriefs: z.record(z.string(), z.any()).default({}),
  quotes: z.array(QuoteItemSchema).default([]),
  changeLog: z.array(ChangeLogEntrySchema).default([]),
  lastUpdated: z.string()
}) as any;

export const GeneratedTaskItemAiSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: BudgetCategorySchema,
  daysBeforeEvent: z.number().int().nonnegative(),
  priority: TaskPrioritySchema,
  dependsOn: z.array(z.string()).default([])
});

export type GeneratedTaskItemAi = z.infer<typeof GeneratedTaskItemAiSchema>;

export interface GeneratedTasksAiResponse {
  tasks: GeneratedTaskItemAi[];
}

export const GeneratedTasksAiResponseSchema: z.ZodType<GeneratedTasksAiResponse, z.ZodTypeDef, any> = z.preprocess((val) => {
  if (Array.isArray(val)) {
    return { tasks: val };
  }
  return val;
}, z.object({
  tasks: z.array(GeneratedTaskItemAiSchema)
}));

export interface QuoteExtractionAiResponse {
  vendorName: string;
  basePriceINR: number;
  tiers?: PricingTier[] | null;
  guestCapacity?: number | null;
  inclusions: string[];
  exclusions: string[];
  additionalChargesBreakdown: AdditionalCharge[];
  paymentTerms: string | null;
  cancellationPolicy: string | null;
  missingInfo: string[];
  redFlags: string[];
}

export const QuoteExtractionAiResponseSchema: z.ZodType<QuoteExtractionAiResponse, z.ZodTypeDef, any> = z.object({
  vendorName: z.string().min(1),
  basePriceINR: z.coerce.number().nonnegative(),
  tiers: z.array(PricingTierSchema).nullable().optional().default(null),
  guestCapacity: z.coerce.number().int().positive().nullable().default(null),
  inclusions: FlexibleStringArraySchema,
  exclusions: FlexibleStringArraySchema,
  additionalChargesBreakdown: z.array(AdditionalChargeSchema).default([]),
  paymentTerms: z.string().nullable().default(null),
  cancellationPolicy: z.string().nullable().default(null),
  missingInfo: FlexibleStringArraySchema,
  redFlags: FlexibleStringArraySchema
});

export const ParsedProfileAiResponseSchema = z.object({
  occasion: OccasionTypeSchema,
  title: z.string(),
  totalBudgetINR: z.coerce.number().positive(),
  expectedGuests: z.coerce.number().int().positive(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  city: z.string(),
  atmosphereTheme: z.string(),
  culturalNeeds: FlexibleStringArraySchema,
  dietaryNeeds: FlexibleStringArraySchema,
  accessibilityNeeds: FlexibleStringArraySchema,
  mustHaves: FlexibleStringArraySchema,
  priorities: z.preprocess((val) => {
    if (Array.isArray(val) && val.length > 3) {
      return val.slice(0, 3);
    }
    return val;
  }, z.tuple([z.string(), z.string(), z.string()])),
  followUpQuestions: z.preprocess((val) => {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      return trimmed ? [trimmed] : [];
    }
    if (Array.isArray(val) && val.length > 3) {
      return val.slice(0, 3);
    }
    return val;
  }, z.array(z.string()).max(3).default([])),
  recommendations: CulturalRecommendationsSchema
});

export const VendorBriefAiResponseSchema = z.object({
  scopeSummary: z.string(),
  keyInclusions: FlexibleStringArraySchema,
  capacityRequirement: z.string(),
  timingDetails: z.string(),
  accessibilityRequirements: FlexibleStringArraySchema,
  negotiationQuestions: z.preprocess((val) => {
    if (typeof val === 'string') {
      return val.split('\n').map((s) => s.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);
    }
    return val;
  }, z.array(z.string()).min(5).max(12))
});

export const DateShiftAiResponseSchema = z.object({
  unrealisticTaskIds: z.array(z.string()),
  compressionAdvice: z.string(),
  suggestedDrops: z.array(z.string())
});

export const DynamicChangeImpactAiResponseSchema = z.object({
  impactSummary: z.string(),
  budgetAdvice: z.string(),
  timelineAdvice: z.string(),
  vendorAdvice: z.string(),
  suggestedActionItems: z.array(z.string())
});
