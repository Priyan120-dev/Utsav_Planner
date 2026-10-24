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

export const EventProfileSchema = z.object({
  occasion: OccasionTypeSchema,
  title: z.string().min(1, 'Title is required'),
  totalBudgetINR: z.number().positive('Budget must be positive'),
  expectedGuests: z.number().int().positive('Guest count must be at least 1'),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  city: z.string().min(1, 'City is required'),
  atmosphereTheme: z.string().default('Warm and celebratory'),
  culturalNeeds: z.array(z.string()).default([]),
  dietaryNeeds: z.array(z.string()).default([]),
  accessibilityNeeds: z.array(z.string()).default([]),
  mustHaves: z.array(z.string()).default([]),
  priorities: z.tuple([z.string(), z.string(), z.string()]),
  followUpQuestions: z.array(z.string()).max(3).optional(),
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
  actionableOptions: z.array(z.string()).min(2).max(4),
  disclaimer: z.string().default('Estimate, not a verified vendor price.')
});

export const TaskItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: BudgetCategorySchema,
  daysBeforeEvent: z.number().int().nonnegative(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  priority: TaskPrioritySchema,
  dependsOn: z.array(z.string()).default([]),
  status: TaskStatusSchema,
  isCriticalPath: z.boolean().optional(),
  isOverdue: z.boolean().optional(),
  isAtRisk: z.boolean().optional()
});

export const GeneratedTaskItemAiSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: BudgetCategorySchema,
  daysBeforeEvent: z.number().int().nonnegative(),
  priority: TaskPrioritySchema,
  dependsOn: z.array(z.string()).default([])
});

export const GeneratedTasksAiResponseSchema = z.object({
  tasks: z.array(GeneratedTaskItemAiSchema)
});

export const AdditionalChargeSchema = z.object({
  item: z.string(),
  amountINR: z.number().nonnegative()
});

export const QuoteExtractionAiResponseSchema = z.object({
  vendorName: z.string().min(1),
  basePriceINR: z.number().nonnegative(),
  guestCapacity: z.number().nullable().default(null),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  additionalChargesBreakdown: z.array(AdditionalChargeSchema).default([]),
  paymentTerms: z.string().nullable().default(null),
  cancellationPolicy: z.string().nullable().default(null),
  missingInfo: z.array(z.string()).default([]),
  redFlags: z.array(z.string()).default([])
});

export const ParsedProfileAiResponseSchema = z.object({
  occasion: OccasionTypeSchema,
  title: z.string(),
  totalBudgetINR: z.number().positive(),
  expectedGuests: z.number().int().positive(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  city: z.string(),
  atmosphereTheme: z.string(),
  culturalNeeds: z.array(z.string()),
  dietaryNeeds: z.array(z.string()),
  accessibilityNeeds: z.array(z.string()),
  mustHaves: z.array(z.string()),
  priorities: z.tuple([z.string(), z.string(), z.string()]),
  followUpQuestions: z.array(z.string()).max(3).default([]),
  recommendations: CulturalRecommendationsSchema
});

export const VendorBriefAiResponseSchema = z.object({
  scopeSummary: z.string(),
  keyInclusions: z.array(z.string()),
  capacityRequirement: z.string(),
  timingDetails: z.string(),
  accessibilityRequirements: z.array(z.string()),
  negotiationQuestions: z.array(z.string()).min(5).max(12)
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
