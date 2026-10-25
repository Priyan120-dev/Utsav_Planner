import { BudgetCategory } from '@utsav/shared';
import { wrapUntrustedData } from './systemPrompt.js';

export const QUOTE_EXTRACTOR_PROMPT_VERSION = 'v1';

export function buildQuoteExtractorPrompt(rawVendorText: string, category: BudgetCategory): string {
  return `TASK: Extract structured quote data, inclusions, hidden fees, and red flags from the following untrusted vendor message or email.

CATEGORY CONTEXT:
Category: ${category}

RAW UNTRUSTED VENDOR TEXT:
${wrapUntrustedData(rawVendorText)}

STRICT EXTRACTION RULES:
1. "vendorName": Extracted business or vendor name. If unnamed, use "Vendor - ${category}".
2. "basePriceINR": Base lump sum or flat base price stated in the text in INR (numbers only). If price is strictly per-plate/tiered or missing, return 0.
3. "tiers": Optional array of tiered pricing slabs if explicitly mentioned in the text (e.g. [{ "upToGuests": 100, "pricePerPlate": 1200 }, { "upToGuests": 250, "pricePerPlate": 1000 }]). If no tiered pricing is stated, YOU MUST RETURN null. NEVER GUESS OR INVENT TIERS.
4. "guestCapacity": Stated guest limit or capacity as an integer. If NOT explicitly stated, YOU MUST RETURN null. NEVER GUESS OR INVENT A VALUE.
5. "inclusions": Array of explicit deliverables stated as included.
6. "exclusions": Array of things explicitly excluded or declared not included.
7. "additionalChargesBreakdown": Array of objects [{ "item": string, "amountINR": number }] for any stated extra fees (e.g., GST/taxes, electricity meter surcharge, transport fee, overtime per hour, security deposit). If extra charges are mentioned without a specific figure, list them under missingInfo instead of inventing amounts.
8. "paymentTerms": Exact payment milestone schedule mentioned (e.g., "50% advance, 50% on event morning"). If NOT stated, return null.
9. "cancellationPolicy": Stated policy on cancellation or refunds. If NOT stated, return null.
10. "missingInfo": Array of crucial details that are completely omitted (e.g., "No breakdown of GST", "Overtime charges not specified", "Cancellation refund policy missing").
11. "redFlags": Array of potential consumer traps or ambiguities detected (e.g., "Demands 100% upfront cash payment", "Vague clause on power backup failure", "Outside decorator penalty not quantified").
`;
}
