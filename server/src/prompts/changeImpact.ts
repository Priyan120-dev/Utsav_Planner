import { EventState } from '@utsav/shared';

export const CHANGE_IMPACT_PROMPT_VERSION = 'v1';

export function buildChangeImpactPrompt(
  eventState: EventState,
  changeType: 'budget' | 'guests' | 'date',
  oldValue: unknown,
  newValue: unknown,
  reason?: string
): string {
  return `TASK: Analyze the holistic impact of an in-flight planning change on an Indian celebration and generate actionable advice.

EVENT CONTEXT:
- Occasion: ${eventState.profile.occasion}
- Title: "${eventState.profile.title}"
- City: ${eventState.profile.city}
- Priorities: ${eventState.profile.priorities.join(', ')}

CHANGE DETAILS:
- Parameter Changed: ${changeType.toUpperCase()}
- Previous Value: ${String(oldValue)}
- New Value: ${String(newValue)}
- Reason provided: ${reason || 'User requested mid-flight adjustment'}

REQUIREMENTS:
1. "impactSummary": A clear, empathetic 2-3 sentence executive summary of what this change means for their event budget, guest experience, and vendor contracts.
2. "budgetAdvice": Strategic guidance on which categories to scale up or down without compromising the core rituals or top priorities.
3. "timelineAdvice": Practical steps to compress, shift, or parallel-track supplier milestones.
4. "vendorAdvice": Immediate communications or renegotiation steps to take with booked or shortlisted vendors.
5. "suggestedActionItems": 3-5 high-priority, concrete checklist tasks the user should execute immediately.
`;
}
