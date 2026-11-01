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

import { generateStructuredContent, resetClient } from '../services/geminiService.js';
import { config } from '../config.js';
import { requestCache } from '../cache.js';

describe('GeminiService Retry and Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestCache.clear();
    resetClient();
    config.GEMINI_API_KEY = 'test-secret-key-12345';
  });

  const TestSchema = z.object({
    greeting: z.string(),
    count: z.number()
  });

  it('retries once when first response is malformed JSON and second is valid', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

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
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Gemini Error Invalid JSON]')
    );
  });

  it('prints raw model response and Zod error to server logs on schema validation failure', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Both attempts return JSON that doesn't match schema (count is missing)
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ greeting: 'Hello only' })
    });

    await expect(
      generateStructuredContent({
        prompt: 'Generate greeting',
        schema: TestSchema,
        cachePrefix: 'test_zod_fail_logs',
        cachePayload: { testId: 2 }
      })
    ).rejects.toThrow(
      'The AI assistant was unable to format its response correctly. Please try again or refine your input.'
    );

    // Verify raw model response and Zod validation errors were logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Gemini Error Schema Validation]')
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Raw model response:',
      expect.stringContaining('Hello only')
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Zod validation errors:',
      expect.stringContaining('Required')
    );
  });

  it('handles 404 model-not-found error: logs distinct message, friendly client error, and does NOT retry', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error404 = Object.assign(
      new Error(
        'models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.8-flash'
      ),
      { status: 404 }
    );
    mockGenerateContent.mockRejectedValueOnce(error404);

    await expect(
      generateStructuredContent({
        prompt: 'Test 404',
        schema: TestSchema,
        cachePrefix: 'test_404',
        cachePayload: { testId: 3 }
      })
    ).rejects.toThrow(
      'The requested AI model is unavailable. Please check the model configuration or try again later.'
    );

    // Crucial: No retry on 404!
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);

    // Verify distinct server log
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Gemini Error 404 - Model Not Found]')
    );
  });

  it('handles 429 quota error: logs distinct message, friendly client error, and does NOT retry', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error429 = Object.assign(new Error('Resource has been exhausted (e.g. check quota).'), {
      status: 429
    });
    mockGenerateContent.mockRejectedValueOnce(error429);

    await expect(
      generateStructuredContent({
        prompt: 'Test 429',
        schema: TestSchema,
        cachePrefix: 'test_429',
        cachePayload: { testId: 4 }
      })
    ).rejects.toThrow(
      'AI service quota or rate limit exceeded. Please wait a moment and try again.'
    );

    // Crucial: No retry on 429!
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);

    // Verify distinct server log
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Gemini Error 429 - Quota Exceeded]')
    );
  });

  it('handles 401/403 auth error: logs distinct message without secrets, friendly client error, and does NOT retry', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const errorAuth = Object.assign(new Error('API key not valid. Please pass a valid API key.'), {
      status: 403
    });
    mockGenerateContent.mockRejectedValueOnce(errorAuth);

    await expect(
      generateStructuredContent({
        prompt: 'Test 403',
        schema: TestSchema,
        cachePrefix: 'test_auth',
        cachePayload: { testId: 5 }
      })
    ).rejects.toThrow(
      'Authentication with the AI service failed. Please verify API key configuration.'
    );

    // Crucial: No retry on Auth error!
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);

    // Verify distinct server log
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Gemini Error 401/403 - Auth Failure]')
    );

    // Verify secret is NOT printed in the server logs
    for (const call of consoleErrorSpy.mock.calls) {
      for (const arg of call) {
        expect(String(arg)).not.toContain('test-secret-key-12345');
      }
    }
  });

  it('retries on timeout: succeeds when retry call responds', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const timeoutErr = Object.assign(new Error('The operation was aborted due to timeout'), {
      name: 'AbortError'
    });

    // 1st attempt: timeout
    mockGenerateContent.mockRejectedValueOnce(timeoutErr);

    // 2nd attempt (retry): successful
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({ greeting: 'Recovered after timeout', count: 1 })
    });

    const result = await generateStructuredContent({
      prompt: 'Test timeout retry',
      schema: TestSchema,
      cachePrefix: 'test_timeout_recover',
      cachePayload: { testId: 6 }
    });

    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ greeting: 'Recovered after timeout', count: 1 });
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[Gemini Error Timeout]'));
  });

  it('handles repeated timeout: logs distinct message and returns friendly client error after retry failure', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const timeoutErr = Object.assign(new Error('Deadline exceeded on request'), {
      code: 'ETIMEDOUT'
    });

    // Both attempts time out
    mockGenerateContent.mockRejectedValue(timeoutErr);

    await expect(
      generateStructuredContent({
        prompt: 'Test timeout repeated',
        schema: TestSchema,
        cachePrefix: 'test_timeout_fail',
        cachePayload: { testId: 7 }
      })
    ).rejects.toThrow('The AI service request timed out. Please try again.');

    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[Gemini Error Timeout]'));
  });
});
