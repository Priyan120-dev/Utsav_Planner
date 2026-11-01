import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { config } from '../config.js';
import { requestCache, MemoryCache } from '../cache.js';
import { SYSTEM_PROMPT_V1 } from '../prompts/systemPrompt.js';

let genAIClient: GoogleGenAI | null = null;

export function getClient(): GoogleGenAI {
  if (!genAIClient) {
    if (!config.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in environment.');
    }
    genAIClient = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  }
  return genAIClient;
}

/**
 * Resets the cached Gemini client instance (primarily for testing)
 */
export function resetClient(): void {
  genAIClient = null;
}

export interface GenerateStructuredOptions<T> {
  prompt: string;
  schema: z.ZodType<T, z.ZodTypeDef, unknown>;
  cachePrefix?: string;
  cachePayload?: unknown;
  systemInstruction?: string;
  temperature?: number;
}

export type GeminiErrorCategory = '404' | '429' | 'auth' | 'timeout' | 'invalid_json' | 'unknown';

export interface ClassifiedGeminiError {
  category: GeminiErrorCategory;
  canRetry: boolean;
  serverLog: string;
  clientMessage: string;
}

/**
 * Categorizes errors encountered during Gemini API calls or response processing.
 * Separates 404 model-not-found, 429 quota, 401/403 auth, timeout, and invalid JSON.
 * Ensures server logs contain no secrets (e.g. API keys).
 */
export function classifyGeminiError(err: unknown, modelName: string): ClassifiedGeminiError {
  const errObj = typeof err === 'object' && err !== null ? (err as Record<string, unknown>) : null;
  const errError =
    typeof errObj?.error === 'object' && errObj?.error !== null
      ? (errObj.error as Record<string, unknown>)
      : null;
  const status = Number(errObj?.status ?? errObj?.statusCode ?? errObj?.code ?? errError?.code);
  const msg = String(errObj?.message ?? errError?.message ?? err ?? '');
  const name = String(errObj?.name ?? '');
  const code = String(errObj?.code ?? '');

  // 1. 404 Model Not Found / Unsupported
  if (
    status === 404 ||
    /404|not found|not_found|no longer available/i.test(msg) ||
    /models\/.*(not found|no longer available|is not found)/i.test(msg)
  ) {
    return {
      category: '404',
      canRetry: false,
      serverLog: `[Gemini Error 404 - Model Not Found] Model "${modelName}" was not found or is no longer available: ${msg}`,
      clientMessage:
        'The requested AI model is unavailable. Please check the model configuration or try again later.'
    };
  }

  // 2. 429 Quota Exceeded / Rate Limit
  if (status === 429 || /429|resource_exhausted|quota|rate limit|too many requests/i.test(msg)) {
    return {
      category: '429',
      canRetry: false,
      serverLog: `[Gemini Error 429 - Quota Exceeded] Rate limit or quota exhausted for model "${modelName}": ${msg}`,
      clientMessage: 'AI service quota or rate limit exceeded. Please wait a moment and try again.'
    };
  }

  // 3. 401/403 Authentication / Permission Error
  if (
    status === 401 ||
    status === 403 ||
    /401|403|api_key_invalid|permission_denied|unauthenticated|unauthorized|forbidden/i.test(msg)
  ) {
    return {
      category: 'auth',
      canRetry: false,
      serverLog: `[Gemini Error 401/403 - Auth Failure] Authentication failed for AI service (status ${status || 'unauthorized'}): ${msg}`,
      clientMessage:
        'Authentication with the AI service failed. Please verify API key configuration.'
    };
  }

  // 4. Timeout
  if (
    name === 'AbortError' ||
    code === 'ETIMEDOUT' ||
    code === 'ESOCKETTIMEDOUT' ||
    /timeout|timed out|aborted|deadline_exceeded/i.test(msg)
  ) {
    return {
      category: 'timeout',
      canRetry: true,
      serverLog: `[Gemini Error Timeout] AI request timed out for model "${modelName}": ${msg}`,
      clientMessage: 'The AI service request timed out. Please try again.'
    };
  }

  // 5. Invalid JSON / Schema Validation
  if (
    err instanceof SyntaxError ||
    name === 'ZodError' ||
    /json|unexpected token|validation failed|schema validation/i.test(msg)
  ) {
    return {
      category: 'invalid_json',
      canRetry: true,
      serverLog: `[Gemini Error Invalid JSON] Model output was not valid JSON or failed schema validation: ${msg}`,
      clientMessage:
        'The AI assistant was unable to format its response correctly. Please try again or refine your input.'
    };
  }

  // 6. Unknown / Other Errors
  return {
    category: 'unknown',
    canRetry: false,
    serverLog: `[Gemini Error Unknown] Unexpected error from AI service for model "${modelName}": ${msg}`,
    clientMessage:
      'An unexpected error occurred while communicating with the AI service. Please try again.'
  };
}

/**
 * Strips accidental markdown backticks if model wraps JSON
 */
function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * Calls Gemini with structured JSON output, validates with Zod,
 * retries once on invalid output or timeouts, and utilizes in-memory caching.
 */
export async function generateStructuredContent<T>(
  options: GenerateStructuredOptions<T>
): Promise<T> {
  const {
    prompt,
    schema,
    cachePrefix,
    cachePayload,
    systemInstruction = SYSTEM_PROMPT_V1,
    temperature = 0.2
  } = options;

  // 1. Check memory cache if caching is requested
  let cacheKey: string | null = null;
  if (cachePrefix && cachePayload) {
    cacheKey = MemoryCache.createKey(cachePrefix, cachePayload);
    const cached = requestCache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const client = getClient();
  const modelName = config.GEMINI_MODEL || 'gemini-3.8-flash';

  const baseConfig: Record<string, unknown> = {
    systemInstruction,
    temperature,
    responseMimeType: 'application/json',
    thinkingConfig: {
      thinkingBudget: 0
    }
  };

  // 2. First attempt
  let lastRawText = '';
  let retryNeeded = false;

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt,
      config: baseConfig
    });

    lastRawText = response.text || '';
    const cleaned = cleanJsonResponse(lastRawText);

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleaned);
    } catch (parseErr: unknown) {
      const parseErrMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      console.error('[Gemini Error Invalid JSON] Model output was not valid JSON (attempt 1):');
      console.error('Raw model response:', lastRawText);
      console.error('JSON parse error:', parseErrMsg);
      retryNeeded = true;
    }

    if (!retryNeeded) {
      const validated = schema.safeParse(parsedJson);
      if (validated.success) {
        if (cacheKey) requestCache.set(cacheKey, validated.data);
        return validated.data;
      }

      // Schema validation failed on first attempt
      console.error(
        '[Gemini Error Schema Validation] Model output failed Zod validation (attempt 1):'
      );
      console.error('Raw model response:', lastRawText);
      console.error('Zod validation errors:', JSON.stringify(validated.error.issues, null, 2));
      retryNeeded = true;
    }
  } catch (err: unknown) {
    const classified = classifyGeminiError(err, modelName);
    console.error(classified.serverLog);

    if (!classified.canRetry) {
      // 404, 429, 401/403, unknown: do not retry!
      throw new Error(classified.clientMessage);
    }

    // Timeout or retryable error
    retryNeeded = true;
  }

  if (!retryNeeded) {
    return null as unknown as T;
  }

  // 3. Retry ONCE (only for invalid JSON or timeout)
  console.log('Retrying Gemini generation with error correction prompt...');
  try {
    const retryPrompt = `${prompt}

IMPORTANT CORRECTION: Your previous output did not strictly conform to the required JSON schema or was not valid JSON.
Previous output snippet: ${lastRawText.substring(0, 300)}...
Please regenerate the response adhering strictly to the schema rules. Output ONLY the raw JSON object.`;

    const retryResponse = await client.models.generateContent({
      model: modelName,
      contents: retryPrompt,
      config: {
        ...baseConfig,
        temperature: 0.1 // Lower temperature on retry for precision
      }
    });

    const retryRawText = retryResponse.text || '';
    const cleaned = cleanJsonResponse(retryRawText);

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleaned);
    } catch (parseErr: unknown) {
      const parseErrMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      console.error('[Gemini Error Invalid JSON] Model output was not valid JSON after retry:');
      console.error('Raw model response:', retryRawText);
      console.error('JSON parse error:', parseErrMsg);
      throw new Error(
        'The AI assistant was unable to format its response correctly. Please try again or refine your input.'
      );
    }

    const validated = schema.safeParse(parsedJson);
    if (validated.success) {
      if (cacheKey) requestCache.set(cacheKey, validated.data);
      return validated.data;
    }

    console.error(
      '[Gemini Error Schema Validation] Model output failed Zod validation after retry:'
    );
    console.error('Raw model response:', retryRawText);
    console.error('Zod validation errors:', JSON.stringify(validated.error.issues, null, 2));
    throw new Error(
      'The AI assistant was unable to format its response correctly. Please try again or refine your input.'
    );
  } catch (error: unknown) {
    const classified = classifyGeminiError(error, modelName);
    const errorMsg = error instanceof Error ? error.message : '';
    // If it's already one of our friendly client messages, rethrow it directly
    if (
      errorMsg ===
        'The AI assistant was unable to format its response correctly. Please try again or refine your input.' ||
      errorMsg === classified.clientMessage
    ) {
      throw error;
    }
    console.error(classified.serverLog);
    throw new Error(classified.clientMessage);
  }
}
