import {
  EventProfile,
  EventState,
  BudgetState,
  TimelineState,
  BudgetCategory,
  QuoteItem,
  TaskItem,
  VendorBrief,
  ParsedProfileAiResponseSchema,
  DateShiftAiResponseSchema,
  DynamicChangeImpactAiResponseSchema
} from '@utsav/shared';
import { z } from 'zod';

export type ParsedProfileResult = Partial<z.infer<typeof ParsedProfileAiResponseSchema>> & {
  priorities?: [string, string, string];
};

export interface DateShiftImpactResult {
  newEventDate?: string;
  daysShifted: number;
  recomputedDeadlines?: Array<{
    id: string;
    title: string;
    oldDate?: string;
    newDate: string;
    status: string;
  }>;
  unrealisticTaskIds: string[];
  updatedTimeline?: TimelineState;
  advice: Partial<z.infer<typeof DateShiftAiResponseSchema>> & {
    compressionAdvice?: string;
    suggestedDrops: string[];
  };
}

export interface DynamicChangeImpactResult {
  changeType?: 'budget' | 'guests' | 'date';
  oldValue: unknown;
  newValue: string | number;
  delta?: number;
  updatedBudget?: BudgetState;
  updatedTimeline?: TimelineState;
  advice: Partial<z.infer<typeof DynamicChangeImpactAiResponseSchema>> & {
    impactSummary?: string;
    budgetAdvice?: string;
    vendorAdvice?: string;
    suggestedActionItems: string[];
  };
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!res.ok) {
    let errMsg = `Server error (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) errMsg = body.error;
    } catch {
      // Ignore JSON parse failure on non-200 responses
    }
    throw new ApiError(errMsg, res.status);
  }

  return res.json() as Promise<T>;
}

export async function parseProfileFromFreeText(
  freeText: string,
  existingProfile?: Partial<EventProfile>,
  signal?: AbortSignal
): Promise<ParsedProfileResult> {
  return request('/ai/parse-profile', {
    method: 'POST',
    body: JSON.stringify({ freeText, existingProfile }),
    signal
  });
}

export async function getBudgetTradeoffAdvice(
  eventState: EventState,
  categoryAdjusted: BudgetCategory,
  newPercentage: number,
  signal?: AbortSignal
): Promise<NonNullable<EventState['budget']['lastAiTradeoff']>> {
  return request('/ai/budget-tradeoffs', {
    method: 'POST',
    body: JSON.stringify({ eventState, categoryAdjusted, newPercentage }),
    signal
  });
}

export async function generateTimelineTasks(
  eventProfile: EventProfile,
  signal?: AbortSignal
): Promise<{ tasks: TaskItem[]; hasCycles: boolean }> {
  return request('/ai/generate-tasks', {
    method: 'POST',
    body: JSON.stringify({ eventProfile }),
    signal
  });
}

export async function analyzeDateShiftImpact(
  eventState: EventState,
  newEventDate: string,
  signal?: AbortSignal
): Promise<DateShiftImpactResult> {
  return request('/ai/date-shift-impact', {
    method: 'POST',
    body: JSON.stringify({ eventState, newEventDate }),
    signal
  });
}

export async function generateVendorBrief(
  eventProfile: EventProfile,
  category: BudgetCategory,
  allocatedBudgetINR: number,
  signal?: AbortSignal
): Promise<VendorBrief & { category: BudgetCategory }> {
  return request('/ai/vendor-brief', {
    method: 'POST',
    body: JSON.stringify({ eventProfile, category, allocatedBudgetINR }),
    signal
  });
}

export async function extractVendorQuote(
  rawText: string,
  category: BudgetCategory,
  guestCount?: number,
  signal?: AbortSignal
): Promise<QuoteItem> {
  return request('/ai/extract-quote', {
    method: 'POST',
    body: JSON.stringify({ rawText, category, guestCount }),
    signal
  });
}

export async function assessDynamicChangeImpact(
  eventState: EventState,
  changeType: 'budget' | 'guests' | 'date',
  newValue: string | number,
  reason?: string,
  signal?: AbortSignal
): Promise<DynamicChangeImpactResult> {
  return request('/ai/change-impact', {
    method: 'POST',
    body: JSON.stringify({ eventState, changeType, newValue, reason }),
    signal
  });
}
