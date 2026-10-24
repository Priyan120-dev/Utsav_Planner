import { EventProfile } from '@utsav/shared';

export const TASK_GENERATOR_PROMPT_VERSION = 'v1';

export function buildTaskGeneratorPrompt(profile: EventProfile): string {
  return `TASK: Generate a sequenced, culturally tailored timeline of tasks with strict dependency ordering for an Indian celebration.

EVENT PROFILE:
- Occasion: ${profile.occasion}
- Title: "${profile.title}"
- Event Date: ${profile.eventDate}
- City: ${profile.city}
- Guests: ${profile.expectedGuests}
- Budget: ₹${profile.totalBudgetINR.toLocaleString('en-IN')}
- Cultural Needs: ${profile.culturalNeeds.join(', ') || 'Standard Indian traditions'}
- Dietary Needs: ${profile.dietaryNeeds.join(', ') || 'Standard'}
- Accessibility: ${profile.accessibilityNeeds.join(', ') || 'Standard'}
- Must Haves: ${profile.mustHaves.join(', ') || 'None specified'}
- Top Priorities: ${profile.priorities.join(', ')}

REQUIREMENTS:
1. Generate between 10 and 16 distinct tasks covering pre-planning to day-of coordination.
2. For each task, supply:
   - id: Unique short slug (e.g., "venue_booking", "caterer_tasting", "mandap_decor_approval", "send_invites")
   - title: Clear, actionable title (e.g., "Shortlist and book auspicious banquet hall & mandap lawn")
   - category: One of 'venue' | 'catering' | 'decor' | 'photography_videography' | 'entertainment' | 'attire' | 'invitations' | 'transport' | 'miscellaneous' | 'contingency'
   - daysBeforeEvent: Number of days BEFORE the event date this task should be completed (e.g. 120 for venue booking, 45 for food tasting, 30 for printing invites, 1 for sound check). Must be >= 0.
   - priority: 'critical' | 'high' | 'medium' | 'low'
   - dependsOn: Array of task "id"s that MUST be completed before this task can begin.
3. DEPENDENCY LOGIC RULES:
   - You MUST enforce real-world dependencies (e.g., venue and event date must be confirmed BEFORE finalising decor layouts or printing invitations).
   - NEVER create circular dependencies (e.g., A depends on B, and B depends on A).
   - Ensure the dependency graph has foundational root tasks with dependsOn: [].
`;
}
