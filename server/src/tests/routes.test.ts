import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import * as geminiService from '../services/geminiService.js';

describe('API Routes Integration (with Mocked LLM)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/health returns 200 and health info', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('utsav-planner-api');
  });

  it('POST /api/ai/parse-profile returns 400 if freeText is too short', async () => {
    const res = await request(app)
      .post('/api/ai/parse-profile')
      .send({ freeText: 'hi' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('POST /api/ai/parse-profile returns parsed profile when LLM succeeds', async () => {
    const mockProfileResponse = {
      occasion: 'wedding',
      title: 'Aman & Priya Wedding',
      totalBudgetINR: 1800000,
      expectedGuests: 300,
      eventDate: '2026-12-15',
      city: 'Delhi',
      atmosphereTheme: 'Classic Punjabi Celebration',
      culturalNeeds: ['Sangeet Night', 'Anand Karaj'],
      dietaryNeeds: ['Vegetarian & Non-Vegetarian counters'],
      accessibilityNeeds: [],
      mustHaves: ['Live Dhol artists'],
      priorities: ['Catering', 'Music & DJ', 'Decor'],
      followUpQuestions: [],
      recommendations: {
        themes: ['Golden Brass & Marigold'],
        menuDirections: ['Live Amritsari Kulcha counter'],
        decorIdeas: ['Phulkari fabric drape canopy'],
        culturalNotes: ['Coordinate early morning Anand Karaj breakfast']
      }
    };

    vi.spyOn(geminiService, 'generateStructuredContent').mockResolvedValueOnce(mockProfileResponse as any);

    const res = await request(app)
      .post('/api/ai/parse-profile')
      .send({ freeText: 'Planning a big fat Punjabi wedding in Delhi in Dec 2026 for 300 guests with 18 lakhs budget.' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Aman & Priya Wedding');
    expect(res.body.totalBudgetINR).toBe(1800000);
  });

  it('POST /api/ai/extract-quote extracts fields and calculates total cost of ownership in code', async () => {
    const mockExtraction = {
      vendorName: 'Royal Tent House',
      basePriceINR: 120000,
      guestCapacity: null,
      inclusions: ['Canopy tents', 'Stage lighting'],
      exclusions: ['Carpeting'],
      additionalChargesBreakdown: [
        { item: 'Overtime setup', amountINR: 15000 }
      ],
      paymentTerms: '50% advance',
      cancellationPolicy: null,
      missingInfo: ['No details on sound permissions'],
      redFlags: []
    };

    vi.spyOn(geminiService, 'generateStructuredContent').mockResolvedValueOnce(mockExtraction as any);

    const res = await request(app)
      .post('/api/ai/extract-quote')
      .send({
        rawText: 'Quotation from Royal Tent House: Base price Rs 1,20,000 including canopy tents. Overtime setup Rs 15,000 extra. 50% advance required.',
        category: 'decor'
      });

    expect(res.status).toBe(200);
    expect(res.body.vendorName).toBe('Royal Tent House');
    expect(res.body.basePriceINR).toBe(120000);
    expect(res.body.additionalChargesINR).toBe(15000);
    expect(res.body.computedTotalCostINR).toBe(135000); // 120000 + 15000 computed deterministically
    expect(res.body.availabilityDisclaimer).toBe('Availability not verified: confirm directly with vendor.');
    expect(res.body.tiers).toBeNull();
  });

  it('POST /api/ai/extract-quote computes tiered pricing in code and keeps unstated fields null', async () => {
    const mockTieredExtraction = {
      vendorName: 'Royal Feast Catering',
      basePriceINR: 20000, // Service & transport fee
      tiers: [
        { upToGuests: 100, pricePerPlate: 1200 },
        { upToGuests: 250, pricePerPlate: 1000 },
        { upToGuests: 500, pricePerPlate: 850 }
      ],
      guestCapacity: null, // unstated
      inclusions: ['Live chaat counter', '3-course buffet'],
      exclusions: ['Mineral water bottles'],
      additionalChargesBreakdown: [
        { item: 'Staff gratuity', amountINR: 5000 }
      ],
      paymentTerms: null, // unstated
      cancellationPolicy: null, // unstated
      missingInfo: ['Payment schedule unstated'],
      redFlags: []
    };

    vi.spyOn(geminiService, 'generateStructuredContent').mockResolvedValueOnce(mockTieredExtraction as any);

    const res = await request(app)
      .post('/api/ai/extract-quote')
      .send({
        rawText: 'Royal Feast Catering quote: Base logistics fee Rs 20,000. Up to 100 guests: Rs 1200/plate, up to 250: Rs 1000/plate. Staff gratuity Rs 5000.',
        category: 'catering',
        guestCount: 200
      });

    expect(res.status).toBe(200);
    expect(res.body.vendorName).toBe('Royal Feast Catering');
    expect(res.body.tiers).toHaveLength(3);
    // Tier calculation: 200 guests falls into upToGuests: 250 -> 1000/plate = 200,000
    // Total = 20,000 (base) + 200,000 (tiered) + 5,000 (additional) = 225,000
    expect(res.body.computedTotalCostINR).toBe(225000);
    expect(res.body.guestCapacity).toBeNull();
    expect(res.body.paymentTerms).toBeNull();
    expect(res.body.cancellationPolicy).toBeNull();
  });

  it('rejects disallowed CORS origins with status 403 and {"error":"Origin not allowed"}', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://malicious-site.com');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Origin not allowed');
  });

  it('POST /api/ai/parse-profile rejects text exceeding 5000 characters', async () => {
    const overlyLongText = 'a'.repeat(5001);
    const res = await request(app)
      .post('/api/ai/parse-profile')
      .send({ freeText: overlyLongText });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('POST /api/ai/extract-quote rejects quote text exceeding 10000 characters', async () => {
    const overlyLongQuote = 'a'.repeat(10001);
    const res = await request(app)
      .post('/api/ai/extract-quote')
      .send({ rawText: overlyLongQuote, category: 'decor' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  // Reusable valid mock structures for complex endpoints
  const mockValidProfile = {
    occasion: 'wedding' as const,
    title: 'Test Wedding Celebration',
    totalBudgetINR: 2000000,
    expectedGuests: 200,
    eventDate: '2026-12-20',
    city: 'Delhi',
    atmosphereTheme: 'Royal Festive',
    culturalNeeds: ['Sangeet'],
    dietaryNeeds: ['Vegetarian'],
    accessibilityNeeds: [],
    mustHaves: ['DJ'],
    priorities: ['Catering', 'Venue', 'Decor'] as [string, string, string],
    followUpQuestions: []
  };

  const mockValidEventState = {
    version: 1,
    id: 'evt-test-1',
    profile: mockValidProfile,
    budget: {
      totalBudgetINR: 2000000,
      categories: {
        venue: { category: 'venue', label: 'Venue & Grounds', allocatedAmountINR: 500000, percentage: 25, perGuestINR: 2500 },
        catering: { category: 'catering', label: 'Catering & Dining', allocatedAmountINR: 600000, percentage: 30, perGuestINR: 3000 },
        decor: { category: 'decor', label: 'Decor', allocatedAmountINR: 300000, percentage: 15, perGuestINR: 1500 },
        photography_videography: { category: 'photography_videography', label: 'Photo/Video', allocatedAmountINR: 200000, percentage: 10, perGuestINR: 1000 },
        entertainment: { category: 'entertainment', label: 'Music/DJ', allocatedAmountINR: 100000, percentage: 5, perGuestINR: 500 },
        attire: { category: 'attire', label: 'Attire', allocatedAmountINR: 100000, percentage: 5, perGuestINR: 500 },
        invitations: { category: 'invitations', label: 'Invites', allocatedAmountINR: 40000, percentage: 2, perGuestINR: 200 },
        transport: { category: 'transport', label: 'Transport', allocatedAmountINR: 40000, percentage: 2, perGuestINR: 200 },
        miscellaneous: { category: 'miscellaneous', label: 'Misc', allocatedAmountINR: 20000, percentage: 1, perGuestINR: 100 },
        contingency: { category: 'contingency', label: 'Contingency', allocatedAmountINR: 100000, percentage: 5, perGuestINR: 500, isContingency: true }
      },
      contingencyPercent: 5,
      perGuestTotalINR: 10000
    },
    timeline: {
      tasks: [
        {
          id: 't-1',
          title: 'Book Venue',
          category: 'venue' as const,
          daysBeforeEvent: 90,
          targetDate: '2026-09-21',
          priority: 'critical' as const,
          dependsOn: [],
          status: 'ready' as const
        }
      ],
      eventDate: '2026-12-20',
      hasCycles: false,
      criticalPathTaskIds: ['t-1']
    },
    vendorBriefs: {},
    quotes: [],
    changeLog: [],
    lastUpdated: new Date().toISOString()
  };

  // 1. POST /api/ai/budget-tradeoffs
  describe('POST /api/ai/budget-tradeoffs', () => {
    it('returns 200 and tradeoff advice on valid payload', async () => {
      const mockTradeoff = {
        explanation: 'Increasing catering from 30% to 35% reduces decor and entertainment headroom.',
        actionableOptions: ['Opt for seasonal flowers instead of exotic imports', 'Bundle DJ sound system with venue lighting'],
        disclaimer: 'Estimate, not a verified vendor price.'
      };

      vi.spyOn(geminiService, 'generateStructuredContent').mockResolvedValueOnce(mockTradeoff as any);

      const res = await request(app)
        .post('/api/ai/budget-tradeoffs')
        .send({
          eventState: mockValidEventState,
          categoryAdjusted: 'catering',
          newPercentage: 35
        });

      expect(res.status).toBe(200);
      expect(res.body.explanation).toBe(mockTradeoff.explanation);
      expect(res.body.actionableOptions).toHaveLength(2);
      expect(res.body.disclaimer).toBe('Estimate, not a verified vendor price.');
    });

    it('returns 400 on invalid payload (missing eventState or invalid category)', async () => {
      const res = await request(app)
        .post('/api/ai/budget-tradeoffs')
        .send({
          eventState: {},
          categoryAdjusted: 'not_a_valid_category',
          newPercentage: 150
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toBeDefined();
    });
  });

  // 2. POST /api/ai/date-shift-impact
  describe('POST /api/ai/date-shift-impact', () => {
    it('returns 200 with recomputed timeline and AI compression advice', async () => {
      const mockDateShiftAdvice = {
        unrealisticTaskIds: [],
        compressionAdvice: 'Compress catering vendor scouting to 2 weeks.',
        suggestedDrops: ['Custom monogram stationery']
      };

      vi.spyOn(geminiService, 'generateStructuredContent').mockResolvedValueOnce(mockDateShiftAdvice as any);

      const res = await request(app)
        .post('/api/ai/date-shift-impact')
        .send({
          eventState: mockValidEventState,
          newEventDate: '2026-11-20'
        });

      expect(res.status).toBe(200);
      expect(res.body.updatedTimeline).toBeDefined();
      expect(res.body.daysShifted).toBe(-30);
      expect(res.body.advice.compressionAdvice).toBe(mockDateShiftAdvice.compressionAdvice);
      expect(res.body.advice.suggestedDrops).toContain('Custom monogram stationery');
    });

    it('returns 400 when newEventDate format is invalid', async () => {
      const res = await request(app)
        .post('/api/ai/date-shift-impact')
        .send({
          eventState: mockValidEventState,
          newEventDate: '20-11-2026' // invalid format (expects YYYY-MM-DD)
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  // 3. POST /api/ai/vendor-brief
  describe('POST /api/ai/vendor-brief', () => {
    it('returns 200 with vendor requirements brief and negotiation questions', async () => {
      const mockBrief = {
        scopeSummary: 'Heritage venue for 200 guests with outside catering permissions.',
        keyInclusions: ['Banquet Hall', 'Air conditioning', 'Generator backup'],
        capacityRequirement: '200 seated guests',
        timingDetails: '4pm to midnight',
        accessibilityRequirements: ['Elevator access to banquet floor'],
        negotiationQuestions: [
          'Is 18% GST included in base quotation?',
          'Are outside decorators permitted without royalty penalty?',
          'What is the hourly generator fuel surcharge?',
          'Is valet parking service and security included?',
          'What are the refund terms if date is shifted?'
        ]
      };

      vi.spyOn(geminiService, 'generateStructuredContent').mockResolvedValueOnce(mockBrief as any);

      const res = await request(app)
        .post('/api/ai/vendor-brief')
        .send({
          eventProfile: mockValidProfile,
          category: 'venue',
          allocatedBudgetINR: 500000
        });

      expect(res.status).toBe(200);
      expect(res.body.category).toBe('venue');
      expect(res.body.scopeSummary).toBe(mockBrief.scopeSummary);
      expect(res.body.negotiationQuestions).toHaveLength(5);
    });

    it('returns 400 when body is invalid', async () => {
      const res = await request(app)
        .post('/api/ai/vendor-brief')
        .send({
          eventProfile: {},
          category: 'invalid_category',
          allocatedBudgetINR: -500
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  // 4. POST /api/ai/change-impact
  describe('POST /api/ai/change-impact', () => {
    it('returns 200 with recalculations and strategic change advice', async () => {
      const mockChangeAdvice = {
        impactSummary: 'Budget increased from ₹20,00,000 to ₹25,00,000.',
        budgetAdvice: 'Allocate 60% of surplus to guest dining experience.',
        timelineAdvice: 'Timeline pacing remains optimal.',
        vendorAdvice: 'Negotiate multi-course live counters with catering team.',
        suggestedActionItems: ['Review upgraded caterer proposals', 'Expand guest welcome hampers']
      };

      vi.spyOn(geminiService, 'generateStructuredContent').mockResolvedValueOnce(mockChangeAdvice as any);

      const res = await request(app)
        .post('/api/ai/change-impact')
        .send({
          eventState: mockValidEventState,
          changeType: 'budget',
          newValue: 2500000,
          reason: 'Additional family contribution'
        });

      expect(res.status).toBe(200);
      expect(res.body.changeType).toBe('budget');
      expect(res.body.oldValue).toBe(2000000);
      expect(res.body.newValue).toBe(2500000);
      expect(res.body.updatedBudget.totalBudgetINR).toBe(2500000);
      expect(res.body.advice.impactSummary).toBe(mockChangeAdvice.impactSummary);
    });

    it('returns 400 when changeType or payload is invalid', async () => {
      const res = await request(app)
        .post('/api/ai/change-impact')
        .send({
          eventState: {},
          changeType: 'unsupported_change_type',
          newValue: 'abc'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });
});
