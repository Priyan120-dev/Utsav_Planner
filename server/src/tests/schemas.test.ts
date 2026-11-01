import { describe, it, expect } from 'vitest';
import {
  ParsedProfileAiResponseSchema,
  BudgetTradeoffAiResponseSchema,
  GeneratedTasksAiResponseSchema,
  QuoteExtractionAiResponseSchema,
  VendorBriefAiResponseSchema
} from '@utsav/shared';

describe('Zod Schema Validation for LLM Responses', () => {
  it('validates a correct ParsedProfileAiResponse', () => {
    const valid = {
      occasion: 'wedding',
      title: 'Kavita & Dev Grand Wedding',
      totalBudgetINR: 2500000,
      expectedGuests: 400,
      eventDate: '2026-11-20',
      city: 'Udaipur',
      atmosphereTheme: 'Royal Rajasthani Heritage',
      culturalNeeds: ['Haldi', 'Mehendi', 'Sangeet', 'Pheras'],
      dietaryNeeds: ['Pure Vegetarian', 'Jain counter'],
      accessibilityNeeds: ['Wheelchair assistance'],
      mustHaves: ['Live Shehnai at entrance'],
      priorities: ['Catering', 'Photography', 'Decor'],
      followUpQuestions: ['Do you require accommodation for outstation guests?'],
      recommendations: {
        themes: ['Mewar Palace Elegance', 'Marigold Sunsets', 'Modern Rajputana'],
        menuDirections: ['Dal Baati Churma station', 'Live Ker Sangri counter', 'Rabdi Jalebi'],
        decorIdeas: ['Brass Urli flower floating', 'Thikri glass work accents'],
        culturalNotes: ['Plan separate timings for evening Sangeet to accommodate elderly family']
      }
    };

    const result = ParsedProfileAiResponseSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('tolerates harmless variations in ParsedProfileAiResponse (comma-separated strings, string numbers, extra priorities)', () => {
    const harmlessVariation = {
      occasion: 'wedding',
      title: 'Kavita & Dev Grand Wedding',
      totalBudgetINR: '2500000', // String number
      expectedGuests: '400', // String number
      eventDate: '2026-11-20',
      city: 'Udaipur',
      atmosphereTheme: 'Royal Rajasthani Heritage',
      culturalNeeds: 'Haldi, Mehendi, Sangeet, Pheras', // Comma-separated string
      dietaryNeeds: 'Pure Vegetarian', // Single string
      accessibilityNeeds: 'Wheelchair ramp access, Golf carts for elders', // Comma-separated string
      mustHaves: 'Live Shehnai at entrance', // Single string
      priorities: ['Catering', 'Photography', 'Decor', 'Entertainment'], // 4 items (should slice to top 3)
      followUpQuestions: 'Do you require accommodation for outstation guests?',
      recommendations: {
        themes: ['Mewar Palace Elegance'],
        menuDirections: ['Dal Baati Churma station'],
        decorIdeas: ['Brass Urli flower floating'],
        culturalNotes: ['Plan separate timings for evening Sangeet']
      }
    };

    const result = ParsedProfileAiResponseSchema.safeParse(harmlessVariation);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalBudgetINR).toBe(2500000);
      expect(result.data.expectedGuests).toBe(400);
      expect(result.data.culturalNeeds).toEqual(['Haldi', 'Mehendi', 'Sangeet', 'Pheras']);
      expect(result.data.dietaryNeeds).toEqual(['Pure Vegetarian']);
      expect(result.data.accessibilityNeeds).toEqual(['Wheelchair ramp access', 'Golf carts for elders']);
      expect(result.data.priorities).toHaveLength(3);
      expect(result.data.priorities).toEqual(['Catering', 'Photography', 'Decor']);
      expect(result.data.followUpQuestions).toEqual(['Do you require accommodation for outstation guests?']);
    }
  });

  it('rejects malformed ParsedProfileAiResponse with invalid occasion or negative budget', () => {
    const invalidOccasion = {
      occasion: 'super_bowl_party', // Not allowed
      title: 'Party',
      totalBudgetINR: -5000, // Negative budget
      expectedGuests: 0,
      eventDate: 'invalid-date',
      city: 'Delhi',
      atmosphereTheme: 'Fun',
      culturalNeeds: [],
      dietaryNeeds: [],
      accessibilityNeeds: [],
      mustHaves: [],
      priorities: ['One', 'Two'], // Only 2 priorities instead of tuple of 3
      recommendations: {
        themes: [],
        menuDirections: [],
        decorIdeas: [],
        culturalNotes: []
      }
    };

    const result = ParsedProfileAiResponseSchema.safeParse(invalidOccasion);
    expect(result.success).toBe(false);
  });

  it('validates BudgetTradeoffAiResponse and defaults estimate disclaimer', () => {
    const valid = {
      explanation: 'Increasing venue by 10% requires reducing decor and entertainment allocations.',
      actionableOptions: [
        'Scale down imported floral decor to local seasonal flowers',
        'Consolidate DJ and live band into a single entertainment vendor'
      ]
    };

    const result = BudgetTradeoffAiResponseSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.disclaimer).toBe('Estimate, not a verified vendor price.');
    }
  });

  it('tolerates top-level array in GeneratedTasksAiResponse from models', () => {
    const rawArray = [
      {
        id: 'venue_booking',
        title: 'Book auspicious wedding hall',
        category: 'venue',
        daysBeforeEvent: 120,
        priority: 'critical',
        dependsOn: []
      },
      {
        id: 'catering_tasting',
        title: 'Sample regional wedding feast',
        category: 'catering',
        daysBeforeEvent: 90,
        priority: 'high',
        dependsOn: ['venue_booking']
      }
    ];

    const result = GeneratedTasksAiResponseSchema.safeParse(rawArray);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tasks).toHaveLength(2);
      expect(result.data.tasks[0].id).toBe('venue_booking');
    }
  });

  it('rejects GeneratedTasksAiResponse if task items lack mandatory fields or have negative daysBeforeEvent', () => {
    const malformed = {
      tasks: [
        {
          id: 'task_1',
          // title is missing!
          category: 'venue',
          daysBeforeEvent: -15, // Invalid negative days
          priority: 'critical',
          dependsOn: []
        }
      ]
    };

    const result = GeneratedTasksAiResponseSchema.safeParse(malformed);
    expect(result.success).toBe(false);
  });

  it('tolerates single string accessibilityRequirements in VendorBriefAiResponse', () => {
    const brief = {
      scopeSummary: 'Provide regal mandap and floral decor for 400 guests in Udaipur.',
      keyInclusions: ['Mandap setup', 'Entrance floral arch', 'Stage lighting'],
      capacityRequirement: '400 seated guests',
      timingDetails: 'Setup by 2 PM, event until 11 PM',
      accessibilityRequirements: 'Wheelchair ramp access required at mandap stage', // string variation
      negotiationQuestions: [
        'Is generator diesel backup included in quotation?',
        'What are the overtime fees past 11 PM?',
        'Is PPL music license royalty covered?',
        'What is outside caterer fee?',
        'What is cancellation policy?'
      ]
    };

    const result = VendorBriefAiResponseSchema.safeParse(brief);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accessibilityRequirements).toEqual([
        'Wheelchair ramp access required at mandap stage'
      ]);
    }
  });

  it('validates QuoteExtractionAiResponse handling null for unstated fields without inventing data', () => {
    const validExtraction = {
      vendorName: 'Heritage Haveli Resort',
      basePriceINR: 500000,
      guestCapacity: null, // Unstated
      inclusions: ['Lawn access for 8 hours'],
      exclusions: ['Electricity generator backup'],
      additionalChargesBreakdown: [
        { item: 'Security Deposit', amountINR: 50000 }
      ],
      paymentTerms: null, // Unstated
      cancellationPolicy: null, // Unstated
      missingInfo: ['Guest capacity not mentioned in quote'],
      redFlags: ['Electricity generator not included in base rate']
    };

    const result = QuoteExtractionAiResponseSchema.safeParse(validExtraction);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.guestCapacity).toBeNull();
      expect(result.data.paymentTerms).toBeNull();
    }
  });
});
