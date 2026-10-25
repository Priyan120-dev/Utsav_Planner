import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent
      }
    }))
  };
});

import { generateStructuredContent } from '../services/geminiService.js';
import { config } from '../config.js';
import { requestCache } from '../cache.js';

describe('GeminiService Retry and Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestCache.clear();
    config.GEMINI_API_KEY = 'test-mock-key';
  });

  const TestSchema = z.object({
    greeting: z.string(),
    count: z.number()
  });

  it('retries once when first response is malformed JSON and second is valid', async () => {
    // 1st attempt: malformed JSON (e.g. unclosed braces or markdown trash)
    mockGenerateContent.mockResolvedValueOnce({
      text: '{ greeting: "incomplete json...'
    });

    // 2nd attempt (retry): valid JSON conforming to TestSchema
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({ greeting: 'Namaste', count: 5 })
    });

    const result = await generateStructuredContent({
      prompt: 'Generate greeting',
      schema: TestSchema,
      cachePrefix: 'test_retry_success',
      cachePayload: { testId: 1 }
    });

    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ greeting: 'Namaste', count: 5 });
  });

  it('returns a friendly error after two consecutive failures', async () => {
    // 1st attempt: malformed JSON
    mockGenerateContent.mockResolvedValueOnce({
      text: '<<< Not even JSON at all >>>'
    });

    // 2nd attempt (retry): still malformed JSON
    mockGenerateContent.mockResolvedValueOnce({
      text: '{"greeting": "Still broken json'
    });

    await expect(
      generateStructuredContent({
        prompt: 'Generate greeting',
        schema: TestSchema,
        cachePrefix: 'test_retry_fail',
        cachePayload: { testId: 2 }
      })
    ).rejects.toThrow(
      'The AI assistant was unable to format its response correctly. Please try again or refine your input.'
    );

    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });
});
