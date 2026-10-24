import { BudgetCategory, EventState } from '@utsav/shared';

export const BUDGET_TRADEOFF_PROMPT_VERSION = 'v1';

export function buildBudgetTradeoffPrompt(
  eventState: EventState,
  categoryAdjusted: BudgetCategory,
  newPercentage: number
): string {
  const currentCategory = eventState.budget.categories[categoryAdjusted];
  const oldPct = currentCategory ? currentCategory.percentage : 0;
  const delta = newPercentage - oldPct;
  const totalBudget = eventState.budget.totalBudgetINR;
  const deltaAmount = Math.round((totalBudget * Math.abs(delta)) / 100);

  return `TASK: Generate a concise, plain-language budget trade-off analysis and concrete decision options for an Indian celebration planner.

EVENT CONTEXT:
- Occasion: ${eventState.profile.occasion}
- Title: "${eventState.profile.title}"
- Total Budget: ₹${totalBudget.toLocaleString('en-IN')}
- Guests: ${eventState.profile.expectedGuests} (Per-head average: ₹${eventState.budget.perGuestTotalINR.toLocaleString('en-IN')})
- User Priorities: ${eventState.profile.priorities.join(', ')}
- Contingency Buffer: ${eventState.budget.contingencyPercent}%

SLIDER ACTION:
- Category Adjusted: "${categoryAdjusted}" (${currentCategory?.label || categoryAdjusted})
- Previous Allocation: ${oldPct}% (₹${currentCategory?.allocatedAmountINR.toLocaleString('en-IN')})
- New Allocation: ${newPercentage}%
- Direction: ${delta >= 0 ? `Increased by ${delta}% (+₹${deltaAmount.toLocaleString('en-IN')})` : `Decreased by ${Math.abs(delta)}% (-₹${deltaAmount.toLocaleString('en-IN')})`}

REQUIREMENTS:
1. "explanation": A warm, smart 2-3 sentence explanation of the trade-off. Mention which categories take the reduction/gain, how it aligns with their priorities, and the impact on experience.
2. "actionableOptions": Provide 2 to 4 concrete, realistic options for the host (e.g., "Trim guest list by 15 people to preserve multi-course live chaat counters", "Opt for seasonal marigold and fabric drapes instead of imported exotic blooms", "Shift welcome dinner to an open-terrace hall").
3. "disclaimer": Must always be: "Estimate, not a verified vendor price."
`;
}
