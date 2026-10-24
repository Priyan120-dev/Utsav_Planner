import { BudgetCategory, EventProfile } from '@utsav/shared';

export const VENDOR_BRIEF_PROMPT_VERSION = 'v1';

export function buildVendorBriefPrompt(
  profile: EventProfile,
  category: BudgetCategory,
  allocatedBudgetINR: number
): string {
  return `TASK: Generate a professional Vendor Requirements Brief and 8 to 10 targeted negotiation and vetting questions for an Indian event vendor.

EVENT CONTEXT:
- Occasion: ${profile.occasion}
- Title: "${profile.title}"
- City: ${profile.city}
- Guests: ${profile.expectedGuests}
- Event Date: ${profile.eventDate}
- Target Category: ${category}
- Allocated Category Budget (Estimate): ₹${allocatedBudgetINR.toLocaleString('en-IN')}
- Cultural & Dietary Needs: ${[...profile.culturalNeeds, ...profile.dietaryNeeds].join(', ') || 'Standard Indian traditions'}
- Accessibility Needs: ${profile.accessibilityNeeds.join(', ') || 'Standard accessibility'}

REQUIREMENTS:
1. "scopeSummary": 2-3 sentences summarizing the exact deliverables, guest scale, and cultural context the vendor must deliver.
2. "keyInclusions": 4-6 specific items that must be included in their baseline quotation (e.g. for catering: live counters, chafing dishes, trained servers, welcome drinks, cleanup).
3. "capacityRequirement": Clear specification of capacity (e.g., seating + floating capacity for ${profile.expectedGuests} guests).
4. "timingDetails": Expected setup timing, event duration, tear-down, and sound/curfew constraints.
5. "accessibilityRequirements": Specific elder/wheelchair or special accommodations necessary for this service.
6. "negotiationQuestions": Exactly 8 to 10 sharp, experienced vetting questions specifically targeting hidden Indian vendor fees (e.g., electricity generator diesel charges, royalty/PPL music license, corkage/outside vendor royalty, bridal suite availability, overtime penalty, breakdown of GST vs cash receipt, tasting session fees).
`;
}
