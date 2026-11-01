import { wrapUntrustedData } from './systemPrompt.js';

export const PROFILE_PARSER_PROMPT_VERSION = 'v1';

export function buildProfileParserPrompt(freeText: string, existingProfile?: Record<string, unknown>): string {
  const existingContext = existingProfile 
    ? `\nExisting partial profile context:\n${JSON.stringify(existingProfile, null, 2)}\n`
    : '';

  return `TASK: Parse the following free-text event description into a structured Indian celebration profile.

${existingContext}
UNTRUSTED USER EVENT DESCRIPTION:
${wrapUntrustedData(freeText)}

REQUIREMENTS:
1. Extract:
   - occasion: one of 'wedding' | 'birthday' | 'community' | 'anniversary' | 'cultural_festival'
   - title: a celebratory, catchy title (e.g., "Rohit & Ananya's Royal Jaipur Wedding" or "Aarav's 1st Birthday Carnival")
   - totalBudgetINR: total estimated budget in Indian Rupees (INR). If not mentioned, estimate a reasonable realistic default for the guest count and occasion (e.g., 1500000 for wedding, 150000 for birthday).
   - expectedGuests: integer count of guests. If not mentioned, default realistically (e.g., 250 for wedding, 50 for birthday).
   - eventDate: ISO date YYYY-MM-DD. If vague like "next December" or "in 6 months", pick a realistic future date.
   - city: Indian city or location mentioned (e.g., Mumbai, Delhi, Jaipur, Bengaluru).
   - atmosphereTheme: mood or theme (e.g., "Regal heritage with marigold aesthetics", "Bollywood glam", "Eco-friendly intimate").
   - culturalNeeds: array of specific traditions or ceremonies mentioned (e.g. ["Mehendi & Sangeet", "Satyanarayan Pooja"]).
   - dietaryNeeds: array of dietary specifications (e.g. ["Pure Vegetarian", "Jain (no onion/garlic)"]).
   - accessibilityNeeds: array of elder/differently-abled requirements (e.g. ["Wheelchair ramp to mandap", "Golf carts for elderly relatives"]).
   - mustHaves: array of key non-negotiable items mentioned.
   - priorities: exactly 3 strings representing the top 3 priorities (e.g., ["Catering & Dining", "Photography & Video", "Decor & Ambiance"]).
2. If key constraints are missing or ambiguous (especially budget, exact date, or guest count), generate at most 3 targeted, polite follow-up questions in "followUpQuestions".
3. Provide tailored cultural recommendations in "recommendations":
   - themes: 3 creative themes that fit the cultural nuance
   - menuDirections: 3 cuisine/food counter concepts that honour the dietary needs
   - decorIdeas: 3 specific decor motifs
   - culturalNotes: 2-3 etiquette or ceremonial notes tailored to this event.
`;
}
