import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ApiError,
  parseProfileFromFreeText,
  getBudgetTradeoffAdvice,
  generateTimelineTasks,
  analyzeDateShiftImpact,
  generateVendorBrief,
  extractVendorQuote,
  assessDynamicChangeImpact
} from '../services/api.js';
import { EventProfile, EventState, initializeBudgetState } from '@utsav/shared';

describe('client api service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockProfile: EventProfile = {
    occasion: 'wedding',
    title: 'Royal Wedding',
    totalBudgetINR: 2000000,
    expectedGuests: 200,
    eventDate: '2026-12-01',
    city: 'Jaipur',
    atmosphereTheme: 'Heritage',
    culturalNeeds: ['Sangeet'],
    dietaryNeeds: ['Vegetarian'],
    accessibilityNeeds: [],
    mustHaves: ['Folk music'],
    priorities: ['Catering & Dining', 'Venue & Grounds', 'Decor, Mandap & Lighting'],
    followUpQuestions: []
  };

  const mockEventState: EventState = {
    version: 1,
    id: 'evt-123',
    profile: mockProfile,
    budget: initializeBudgetState(2000000, 'wedding', mockProfile.priorities, 200),
    timeline: {
      tasks: [],
      eventDate: '2026-12-01',
      hasCycles: false,
      criticalPathTaskIds: []
    },
    vendorBriefs: {},
    quotes: [],
    changeLog: [],
    lastUpdated: new Date().toISOString()
  };

  it('ApiError instantiates with message and status', () => {
    const err = new ApiError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.status).toBe(404);
    expect(err.name).toBe('ApiError');
  });

  it('handles non-ok response with json error message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Custom error from server' })
    });

    await expect(parseProfileFromFreeText('test prompt')).rejects.toThrow('Custom error from server');
  });

  it('handles non-ok response with non-json fallback message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Invalid JSON');
      }
    });

    await expect(parseProfileFromFreeText('test prompt')).rejects.toThrow('Server error (500)');
  });

  it('calls parseProfileFromFreeText correctly', async () => {
    const mockResponse = { occasion: 'wedding', title: 'Parsed Wedding' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });
    global.fetch = fetchMock;

    const controller = new AbortController();
    const result = await parseProfileFromFreeText('Royal wedding description', { city: 'Jaipur' }, controller.signal);

    expect(result).toEqual(mockResponse);
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/parse-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ freeText: 'Royal wedding description', existingProfile: { city: 'Jaipur' } }),
      signal: controller.signal
    });
  });

  it('calls getBudgetTradeoffAdvice correctly', async () => {
    const mockAdvice = {
      explanation: 'Reduced catering to increase venue',
      actionableOptions: ['Opt for buffet'],
      disclaimer: 'Estimates only'
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockAdvice
    });
    global.fetch = fetchMock;

    const result = await getBudgetTradeoffAdvice(mockEventState, 'catering', 35);
    expect(result).toEqual(mockAdvice);
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/budget-tradeoffs', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ eventState: mockEventState, categoryAdjusted: 'catering', newPercentage: 35 })
    }));
  });

  it('calls generateTimelineTasks correctly', async () => {
    const mockTasks = { tasks: [{ id: 'task-1', title: 'Book Venue' }], hasCycles: false };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTasks
    });
    global.fetch = fetchMock;

    const result = await generateTimelineTasks(mockProfile);
    expect(result).toEqual(mockTasks);
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/generate-tasks', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ eventProfile: mockProfile })
    }));
  });

  it('calls analyzeDateShiftImpact correctly', async () => {
    const mockShift = { daysShifted: -14, advice: { compressionAdvice: 'Compress decor timeline' } };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockShift
    });
    global.fetch = fetchMock;

    const result = await analyzeDateShiftImpact(mockEventState, '2026-11-17');
    expect(result).toEqual(mockShift);
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/date-shift-impact', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ eventState: mockEventState, newEventDate: '2026-11-17' })
    }));
  });

  it('calls generateVendorBrief correctly', async () => {
    const mockBrief = {
      category: 'catering',
      title: 'Catering Brief',
      scopeOfWork: 'Royal buffet',
      keyRequirements: ['Vegetarian'],
      suggestedDeliverables: ['Live counters'],
      negotiationQuestions: ['Can you provide sample tasting?'],
      contractChecklist: ['Taxes included'],
      budgetGuidelineINR: 600000
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBrief
    });
    global.fetch = fetchMock;

    const result = await generateVendorBrief(mockProfile, 'catering', 600000);
    expect(result).toEqual(mockBrief);
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/vendor-brief', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ eventProfile: mockProfile, category: 'catering', allocatedBudgetINR: 600000 })
    }));
  });

  it('calls extractVendorQuote correctly', async () => {
    const mockQuote = {
      id: 'quote-1',
      category: 'catering',
      vendorName: 'Royal Caterers',
      basePriceINR: 150000,
      computedTotalCostINR: 175000
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockQuote
    });
    global.fetch = fetchMock;

    const result = await extractVendorQuote('Royal Caterers estimate: Rs 150,000', 'catering', 200);
    expect(result).toEqual(mockQuote);
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/extract-quote', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ rawText: 'Royal Caterers estimate: Rs 150,000', category: 'catering', guestCount: 200 })
    }));
  });

  it('calls assessDynamicChangeImpact correctly', async () => {
    const mockChange = {
      changeType: 'guests',
      newValue: 250,
      advice: { impactSummary: 'Increased guests by 50' }
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockChange
    });
    global.fetch = fetchMock;

    const result = await assessDynamicChangeImpact(mockEventState, 'guests', 250, 'More family arriving');
    expect(result).toEqual(mockChange);
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/change-impact', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ eventState: mockEventState, changeType: 'guests', newValue: 250, reason: 'More family arriving' })
    }));
  });
});
