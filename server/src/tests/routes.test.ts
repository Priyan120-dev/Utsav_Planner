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
  });
});
