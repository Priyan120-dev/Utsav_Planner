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
  });
});
