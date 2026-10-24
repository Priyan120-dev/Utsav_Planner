import { BudgetCategory, QuoteItem } from './types.js';

export const AVAILABILITY_DISCLAIMER = 'Availability not verified: confirm directly with vendor.';

/**
 * Computes Total Cost of Ownership (TCO) deterministically
 * by adding base price and all parsed additional charges.
 */
export function calculateQuoteTCO(
  basePriceINR: number,
  additionalChargesBreakdown: { item: string; amountINR: number }[] = []
): { totalAdditionalChargesINR: number; totalCostINR: number } {
  const safeBase = Math.max(0, Number(basePriceINR) || 0);
  const totalAdditionalChargesINR = additionalChargesBreakdown.reduce((sum, item) => {
    return sum + Math.max(0, Number(item.amountINR) || 0);
  }, 0);

  return {
    totalAdditionalChargesINR,
    totalCostINR: safeBase + totalAdditionalChargesINR
  };
}

/**
 * Analyzes missing fields in an extracted quote
 */
export function analyzeMissingQuoteFields(quote: Partial<QuoteItem>): string[] {
  const missing: string[] = [];
  if (quote.guestCapacity === null || quote.guestCapacity === undefined) {
    missing.push('Guest capacity not specified');
  }
  if (!quote.paymentTerms || quote.paymentTerms.trim() === '') {
    missing.push('Payment milestone terms missing');
  }
  if (!quote.cancellationPolicy || quote.cancellationPolicy.trim() === '') {
    missing.push('Cancellation/refund policy missing');
  }
  if (!quote.inclusions || quote.inclusions.length === 0) {
    missing.push('Detailed inclusions list not provided');
  }
  return missing;
}

/**
 * Builds a normalized QuoteItem with deterministic math and safety disclaimers
 */
export function createNormalizedQuote(
  rawExtraction: {
    vendorName: string;
    basePriceINR: number;
    guestCapacity?: number | null;
    inclusions?: string[];
    exclusions?: string[];
    additionalChargesBreakdown?: { item: string; amountINR: number }[];
    paymentTerms?: string | null;
    cancellationPolicy?: string | null;
    missingInfo?: string[];
    redFlags?: string[];
  },
  category: BudgetCategory
): QuoteItem {
  const { totalAdditionalChargesINR, totalCostINR } = calculateQuoteTCO(
    rawExtraction.basePriceINR,
    rawExtraction.additionalChargesBreakdown
  );

  const missingFromExtraction = rawExtraction.missingInfo || [];
  const algorithmicMissing = analyzeMissingQuoteFields(rawExtraction);
  const combinedMissing = Array.from(new Set([...missingFromExtraction, ...algorithmicMissing]));

  const id = `quote_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id,
    category,
    vendorName: rawExtraction.vendorName || 'Unnamed Vendor',
    basePriceINR: rawExtraction.basePriceINR,
    guestCapacity: rawExtraction.guestCapacity ?? null,
    inclusions: rawExtraction.inclusions || [],
    exclusions: rawExtraction.exclusions || [],
    additionalChargesINR: totalAdditionalChargesINR,
    additionalChargesBreakdown: rawExtraction.additionalChargesBreakdown || [],
    paymentTerms: rawExtraction.paymentTerms ?? null,
    cancellationPolicy: rawExtraction.cancellationPolicy ?? null,
    missingInfo: combinedMissing,
    redFlags: rawExtraction.redFlags || [],
    computedTotalCostINR: totalCostINR,
    availabilityDisclaimer: AVAILABILITY_DISCLAIMER
  };
}
