import { describe, it, expect } from 'vitest';
import {
  calculateQuoteTCO,
  analyzeMissingQuoteFields,
  createNormalizedQuote,
  AVAILABILITY_DISCLAIMER
} from '@utsav/shared';

describe('Quote Pure Logic', () => {
  it('calculates total cost of ownership adding base price and additional charges', () => {
    const base = 250000;
    const additional = [
      { item: '18% GST', amountINR: 45000 },
      { item: 'Generator Diesel Charges', amountINR: 12000 },
      { item: 'Overtime 2 hours', amountINR: 8000 }
    ];

    const result = calculateQuoteTCO(base, additional);
    expect(result.totalAdditionalChargesINR).toBe(65000);
    expect(result.totalCostINR).toBe(315000);
  });

  it('detects missing critical information in quotes', () => {
    const incompleteQuote = {
      vendorName: 'Royal Sweets Caterers',
      basePriceINR: 150000,
      guestCapacity: null,
      paymentTerms: null,
      cancellationPolicy: null,
      inclusions: []
    };

    const missing = analyzeMissingQuoteFields(incompleteQuote);
    expect(missing).toContain('Guest capacity not specified');
    expect(missing).toContain('Payment milestone terms missing');
    expect(missing).toContain('Cancellation/refund policy missing');
    expect(missing).toContain('Detailed inclusions list not provided');
  });

  it('creates normalized quote with availability disclaimer and computed TCO', () => {
    const normalized = createNormalizedQuote(
      {
        vendorName: 'Shehnai DJ & Sound',
        basePriceINR: 50000,
        guestCapacity: 300,
        inclusions: ['Line array sound system', 'Wireless microphones'],
        exclusions: ['Music license royalty fees'],
        additionalChargesBreakdown: [{ item: 'PPL License', amountINR: 7500 }],
        paymentTerms: '50% advance, 50% post event',
        cancellationPolicy: 'Non-refundable advance',
        missingInfo: [],
        redFlags: ['No clause on rain damage']
      },
      'entertainment'
    );

    expect(normalized.vendorName).toBe('Shehnai DJ & Sound');
    expect(normalized.computedTotalCostINR).toBe(57500);
    expect(normalized.additionalChargesINR).toBe(7500);
    expect(normalized.availabilityDisclaimer).toBe(AVAILABILITY_DISCLAIMER);
    expect(normalized.category).toBe('entertainment');
    expect(normalized.tiers).toBeNull();
  });

  describe('Tiered Pricing Calculation', () => {
    const tiers = [
      { upToGuests: 100, pricePerPlate: 1200 },
      { upToGuests: 250, pricePerPlate: 1000 },
      { upToGuests: 500, pricePerPlate: 850 }
    ];

    it('calculates tiered cost correctly for guest counts in different slabs', () => {
      // 80 guests -> falls in upToGuests: 100 slab (1200/plate)
      const cost1 = calculateQuoteTCO(0, [], tiers, 80);
      expect(cost1.tieredCostINR).toBe(80 * 1200); // 96,000
      expect(cost1.totalCostINR).toBe(96000);

      // 200 guests -> falls in upToGuests: 250 slab (1000/plate)
      const cost2 = calculateQuoteTCO(
        20000,
        [{ item: 'Service Tax', amountINR: 5000 }],
        tiers,
        200
      );
      expect(cost2.tieredCostINR).toBe(200 * 1000); // 200,000
      expect(cost2.totalAdditionalChargesINR).toBe(5000);
      expect(cost2.totalCostINR).toBe(225000); // 20000 + 200000 + 5000
    });

    it('falls back to the highest tier rate when guest count exceeds all tiers', () => {
      // 600 guests exceeds 500 -> uses 850/plate
      const cost = calculateQuoteTCO(0, [], tiers, 600);
      expect(cost.tieredCostINR).toBe(600 * 850); // 510,000
      expect(cost.totalCostINR).toBe(510000);
    });

    it('returns zero tiered cost when tiers are null or guest count is zero/null', () => {
      expect(calculateQuoteTCO(50000, [], null, 250).tieredCostINR).toBe(0);
      expect(calculateQuoteTCO(50000, [], tiers, null).tieredCostINR).toBe(0);
      expect(calculateQuoteTCO(50000, [], tiers, 0).tieredCostINR).toBe(0);
    });

    it('creates normalized quote with tiers and keeps unstated fields null', () => {
      const normalized = createNormalizedQuote(
        {
          vendorName: 'Annapurna Gourmet Caterers',
          basePriceINR: 15000, // setup fee
          tiers: [
            { upToGuests: 150, pricePerPlate: 800 },
            { upToGuests: 300, pricePerPlate: 700 }
          ],
          guestCapacity: null, // unstated
          inclusions: ['Welcome drinks', 'Buffet spread'],
          exclusions: ['Dessert counter'],
          additionalChargesBreakdown: [{ item: 'Crockery rental', amountINR: 8000 }],
          paymentTerms: null, // unstated
          cancellationPolicy: null // unstated
        },
        'catering',
        200 // target guests
      );

      expect(normalized.tiers).toEqual([
        { upToGuests: 150, pricePerPlate: 800 },
        { upToGuests: 300, pricePerPlate: 700 }
      ]);
      // 200 guests -> 700/plate = 140,000 + 15,000 base + 8,000 crockery = 163,000
      expect(normalized.computedTotalCostINR).toBe(163000);
      expect(normalized.guestCapacity).toBeNull();
      expect(normalized.paymentTerms).toBeNull();
      expect(normalized.cancellationPolicy).toBeNull();
    });
  });
});
