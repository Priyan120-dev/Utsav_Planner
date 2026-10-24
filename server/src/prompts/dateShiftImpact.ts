import { EventState } from '@utsav/shared';

export const DATE_SHIFT_PROMPT_VERSION = 'v1';

export function buildDateShiftImpactPrompt(
  eventState: EventState,
  newEventDate: string,
  daysShifted: number,
  unrealisticTaskTitles: string[]
): string {
  const direction = daysShifted < 0 
    ? `preponed (moved earlier) by ${Math.abs(daysShifted)} days`
    : `postponed (moved later) by ${daysShifted} days`;

  return `TASK: Analyze the impact of a date shift on an Indian event planning timeline and advise on compression, merging, or dropping of tasks.

EVENT CONTEXT:
- Occasion: ${eventState.profile.occasion}
- Title: "${eventState.profile.title}"
- Previous Date: ${eventState.timeline.eventDate}
- New Date: ${newEventDate} (${direction})
- City: ${eventState.profile.city}

TASKS WITH TIGHT OR EXPIRED DEADLINES DUE TO SHIFT:
${unrealisticTaskTitles.length > 0 ? unrealisticTaskTitles.map(t => `- ${t}`).join('\n') : '- None with severe past deadlines'}

REQUIREMENTS:
1. "unrealisticTaskIds": List the IDs of tasks that are realistically unfeasible under the compressed schedule.
2. "compressionAdvice": A reassuring, expert 2-4 sentence advisory on how to compress the timeline, expedite vendor contracts, or run parallel approvals.
3. "suggestedDrops": 2-4 non-essential items or luxury tasks that can be safely merged or eliminated to alleviate pressure.
`;
}
