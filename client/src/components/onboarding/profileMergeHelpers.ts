/**
 * Pure helpers for merging parsed celebration profile fields and clarifications.
 */

export function mergeCommaSeparatedValues(existingText: string, incomingValues?: string[]): string {
  if (!incomingValues || incomingValues.length === 0) return existingText;
  const existing = existingText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const merged = Array.from(new Set([...existing, ...incomingValues]));
  return merged.join(', ');
}

export function parseCommaSeparatedList(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildCombinedPromptText(
  freeText: string,
  followUpQuestions: string[],
  followUpAnswers: Record<number, string>
): string {
  const clarifications = followUpQuestions
    .map((q, idx) => {
      const a = followUpAnswers[idx]?.trim();
      return a ? `Question: ${q}\nAnswer: ${a}` : null;
    })
    .filter(Boolean)
    .join('\n\n');

  return clarifications ? `${freeText}\n\nCLARIFICATIONS & ANSWERS:\n${clarifications}` : freeText;
}
