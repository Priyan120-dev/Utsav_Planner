import {
  EventProfile,
  EventState,
  BudgetCategory,
  QuoteItem,
  TaskItem,
  VendorBrief
} from '@utsav/shared';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch {
      // fallback
    }
    throw new ApiError(errorMsg, res.status);
  }

  return res.json() as Promise<T>;
}

export async function parseProfileFromFreeText(
  freeText: string,
  existingProfile?: Partial<EventProfile>,
  signal?: AbortSignal
): Promise<any> {
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
): Promise<{ explanation: string; actionableOptions: string[]; disclaimer: string }> {
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
): Promise<any> {
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
  signal?: AbortSignal
): Promise<QuoteItem> {
  return request('/ai/extract-quote', {
    method: 'POST',
    body: JSON.stringify({ rawText, category }),
    signal
  });
}

export async function assessDynamicChangeImpact(
  eventState: EventState,
  changeType: 'budget' | 'guests' | 'date',
  newValue: string | number,
  reason?: string,
  signal?: AbortSignal
): Promise<any> {
  return request('/ai/change-impact', {
    method: 'POST',
    body: JSON.stringify({ eventState, changeType, newValue, reason }),
    signal
  });
}
