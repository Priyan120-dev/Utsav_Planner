import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { 
  EventProfileSchema,
  EventStateSchema,
  TaskItem,
  ParsedProfileAiResponseSchema,
  BudgetTradeoffAiResponseSchema,
  GeneratedTasksAiResponseSchema,
  DateShiftAiResponseSchema,
  VendorBriefAiResponseSchema,
  QuoteExtractionAiResponseSchema,
  DynamicChangeImpactAiResponseSchema,
  detectCycles,
  evaluateTaskStatuses,
  shiftTimelineDate,
  createNormalizedQuote,
  recalculateBudgetForParameters,
  BudgetCategorySchema
} from '@utsav/shared';
import { generateStructuredContent } from '../services/geminiService.js';
import { buildProfileParserPrompt } from '../prompts/profileParser.js';
import { buildBudgetTradeoffPrompt } from '../prompts/budgetTradeoff.js';
import { buildTaskGeneratorPrompt } from '../prompts/taskGenerator.js';
import { buildDateShiftImpactPrompt } from '../prompts/dateShiftImpact.js';
import { buildVendorBriefPrompt } from '../prompts/vendorBrief.js';
import { buildQuoteExtractorPrompt } from '../prompts/quoteExtractor.js';
import { buildChangeImpactPrompt } from '../prompts/changeImpact.js';

export const aiRouter = Router();

// 1. Parse Profile from Free Text
const ParseProfileReqSchema = z.object({
  freeText: z.string().min(5, 'Description must be at least 5 characters').max(5000, 'Description cannot exceed 5000 characters'),
  existingProfile: z.record(z.unknown()).optional()
});

aiRouter.post('/parse-profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = ParseProfileReqSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.issues });
      return;
    }

    const { freeText, existingProfile } = parseResult.data;
    const prompt = buildProfileParserPrompt(freeText, existingProfile);

    const parsedData = await generateStructuredContent({
      prompt,
      schema: ParsedProfileAiResponseSchema,
      cachePrefix: 'profile_parse',
      cachePayload: { freeText, existingProfile }
    });

    res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /parse-profile:', error.message);
    res.status(500).json({ error: error.message || 'Failed to parse celebration profile' });
  }
});

// 2. Budget Trade-offs
const BudgetTradeoffReqSchema = z.object({
  eventState: EventStateSchema,
  categoryAdjusted: BudgetCategorySchema,
  newPercentage: z.number().min(0).max(100)
});

aiRouter.post('/budget-tradeoffs', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = BudgetTradeoffReqSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.issues });
      return;
    }

    const { eventState, categoryAdjusted, newPercentage } = parseResult.data;
    const prompt = buildBudgetTradeoffPrompt(eventState, categoryAdjusted, newPercentage);

    const tradeoffData = await generateStructuredContent({
      prompt,
      schema: BudgetTradeoffAiResponseSchema,
      cachePrefix: 'budget_tradeoff',
      cachePayload: {
        occasion: eventState.profile?.occasion,
        totalBudget: eventState.budget?.totalBudgetINR,
        guests: eventState.profile?.expectedGuests,
        category: categoryAdjusted,
        newPercentage
      }
    });

    res.json(tradeoffData);
  } catch (error: any) {
    console.error('Error in /budget-tradeoffs:', error.message);
    res.status(500).json({ error: error.message || 'Failed to evaluate budget trade-off' });
  }
});

// 3. Generate Sequenced Tasks
const GenerateTasksReqSchema = z.object({
  eventProfile: EventProfileSchema
});

aiRouter.post('/generate-tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = GenerateTasksReqSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.issues });
      return;
    }

    const { eventProfile } = parseResult.data;
    const prompt = buildTaskGeneratorPrompt(eventProfile);

    const generated = await generateStructuredContent({
      prompt,
      schema: GeneratedTasksAiResponseSchema,
      cachePrefix: 'tasks_gen',
      cachePayload: {
        occasion: eventProfile.occasion,
        date: eventProfile.eventDate,
        priorities: eventProfile.priorities
      }
    });

    // Code validation: check DAG for cycles
    const rawTasks: TaskItem[] = generated.tasks.map(t => ({
      ...t,
      dependsOn: t.dependsOn || [],
      status: 'locked' as const,
      targetDate: ''
    }));

    const hasCycles = detectCycles(rawTasks);

    // Compute deadlines and statuses deterministically in code
    const evaluatedTasks = evaluateTaskStatuses(rawTasks, eventProfile.eventDate);

    res.json({
      tasks: evaluatedTasks,
      hasCycles
    });
  } catch (error: any) {
    console.error('Error in /generate-tasks:', error.message);
    res.status(500).json({ error: error.message || 'Failed to generate timeline tasks' });
  }
});

// 4. Date Shift Impact Analysis
const DateShiftReqSchema = z.object({
  eventState: EventStateSchema,
  newEventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

aiRouter.post('/date-shift-impact', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = DateShiftReqSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.issues });
      return;
    }

    const { eventState, newEventDate } = parseResult.data;

    // 1. Recompute deadlines deterministically in code
    const { updatedTimeline, unrealisticTaskIds, daysShifted } = shiftTimelineDate(
      eventState.timeline,
      newEventDate
    );

    const unrealisticTitles = updatedTimeline.tasks
      .filter(t => unrealisticTaskIds.includes(t.id))
      .map(t => t.title);

    // 2. Ask LLM for compression advice and suggested drops
    const prompt = buildDateShiftImpactPrompt(
      eventState,
      newEventDate,
      daysShifted,
      unrealisticTitles
    );

    const advice = await generateStructuredContent({
      prompt,
      schema: DateShiftAiResponseSchema,
      cachePrefix: 'date_shift',
      cachePayload: {
        previousDate: eventState.timeline.eventDate,
        newEventDate,
        unrealisticCount: unrealisticTaskIds.length
      }
    });

    res.json({
      updatedTimeline: {
        ...updatedTimeline,
        lastDateShiftImpact: {
          previousDate: eventState.timeline.eventDate,
          newDate: newEventDate,
          daysShifted,
          unrealisticTaskIds,
          compressionAdvice: advice.compressionAdvice,
          suggestedDrops: advice.suggestedDrops
        }
      },
      unrealisticTaskIds,
      daysShifted,
      advice
    });
  } catch (error: any) {
    console.error('Error in /date-shift-impact:', error.message);
    res.status(500).json({ error: error.message || 'Failed to evaluate date shift impact' });
  }
});

// 5. Vendor Brief & Negotiation Questions
const VendorBriefReqSchema = z.object({
  eventProfile: EventProfileSchema,
  category: BudgetCategorySchema,
  allocatedBudgetINR: z.number().nonnegative()
});

aiRouter.post('/vendor-brief', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = VendorBriefReqSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.issues });
      return;
    }

    const { eventProfile, category, allocatedBudgetINR } = parseResult.data;
    const prompt = buildVendorBriefPrompt(eventProfile, category, allocatedBudgetINR);

    const briefData = await generateStructuredContent({
      prompt,
      schema: VendorBriefAiResponseSchema,
      cachePrefix: 'vendor_brief',
      cachePayload: {
        occasion: eventProfile.occasion,
        category,
        guests: eventProfile.expectedGuests,
        budget: allocatedBudgetINR
      }
    });

    res.json({
      category,
      ...briefData
    });
  } catch (error: any) {
    console.error('Error in /vendor-brief:', error.message);
    res.status(500).json({ error: error.message || 'Failed to generate vendor requirements brief' });
  }
});

// 6. Extract Structured Quote from Raw Text
const ExtractQuoteReqSchema = z.object({
  rawText: z.string().min(10, 'Vendor quote text is too short to analyze').max(10000, 'Vendor quote text cannot exceed 10000 characters'),
  category: BudgetCategorySchema,
  guestCount: z.number().int().positive().optional()
});

aiRouter.post('/extract-quote', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = ExtractQuoteReqSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.issues });
      return;
    }

    const { rawText, category, guestCount } = parseResult.data;
    const prompt = buildQuoteExtractorPrompt(rawText, category);

    // LLM extracts structured fields without inventing values
    const extraction = await generateStructuredContent({
      prompt,
      schema: QuoteExtractionAiResponseSchema,
      cachePrefix: 'quote_extract',
      cachePayload: { rawText, category }
    });

    // Pure code creates normalized QuoteItem and deterministically calculates TCO
    const normalizedQuote = createNormalizedQuote(extraction, category, guestCount);

    res.json(normalizedQuote);
  } catch (error: any) {
    console.error('Error in /extract-quote:', error.message);
    res.status(500).json({ error: error.message || 'Failed to extract vendor quote' });
  }
});

// 7. Dynamic Change Impact Assessment
const DynamicChangeReqSchema = z.object({
  eventState: EventStateSchema,
  changeType: z.enum(['budget', 'guests', 'date']),
  newValue: z.union([z.string(), z.number()]),
  reason: z.string().max(1000, 'Reason cannot exceed 1000 characters').optional()
});

aiRouter.post('/change-impact', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = DynamicChangeReqSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.issues });
      return;
    }

    const { eventState, changeType, newValue, reason } = parseResult.data;

    let oldValue: unknown = null;
    let updatedBudget = eventState.budget;
    let updatedTimeline = eventState.timeline;

    if (changeType === 'budget') {
      oldValue = eventState.profile.totalBudgetINR;
      const numVal = Number(newValue);
      updatedBudget = recalculateBudgetForParameters(
        eventState.budget,
        numVal,
        eventState.profile.expectedGuests
      );
    } else if (changeType === 'guests') {
      oldValue = eventState.profile.expectedGuests;
      const numVal = Number(newValue);
      updatedBudget = recalculateBudgetForParameters(
        eventState.budget,
        eventState.budget.totalBudgetINR,
        numVal
      );
    } else if (changeType === 'date') {
      oldValue = eventState.profile.eventDate;
      const dateStr = String(newValue);
      const shiftRes = shiftTimelineDate(eventState.timeline, dateStr);
      updatedTimeline = shiftRes.updatedTimeline;
    }

    // Call LLM for strategic impact assessment
    const prompt = buildChangeImpactPrompt(eventState, changeType, oldValue, newValue, reason);

    const advice = await generateStructuredContent({
      prompt,
      schema: DynamicChangeImpactAiResponseSchema,
      cachePrefix: 'change_impact',
      cachePayload: {
        changeType,
        oldValue,
        newValue,
        occasion: eventState.profile.occasion
      }
    });

    res.json({
      changeType,
      oldValue,
      newValue,
      updatedBudget,
      updatedTimeline,
      advice
    });
  } catch (error: any) {
    console.error('Error in /change-impact:', error.message);
    res.status(500).json({ error: error.message || 'Failed to analyze change impact' });
  }
});
