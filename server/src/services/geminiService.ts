import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { config } from '../config.js';
import { requestCache, MemoryCache } from '../cache.js';
import { SYSTEM_PROMPT_V1 } from '../prompts/systemPrompt.js';

let genAIClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!genAIClient) {
    if (!config.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in environment.');
    }
    genAIClient = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  }
  return genAIClient;
}

export interface GenerateStructuredOptions<T> {
  prompt: string;
  schema: z.ZodSchema<T>;
  cachePrefix?: string;
  cachePayload?: unknown;
  systemInstruction?: string;
  temperature?: number;
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
 * retries once on invalid output, and utilizes in-memory caching.
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
  const modelName = config.GEMINI_MODEL || 'gemini-2.5-flash';

  // 2. First attempt
  let lastRawText = '';
  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        temperature,
        responseMimeType: 'application/json'
      }
    });

    lastRawText = response.text || '';
    const cleaned = cleanJsonResponse(lastRawText);
    const parsedJson = JSON.parse(cleaned);
    const validated = schema.safeParse(parsedJson);

    if (validated.success) {
      if (cacheKey) requestCache.set(cacheKey, validated.data);
      return validated.data;
    }

    // Schema validation failed on first attempt
    console.warn('First Gemini attempt failed Zod validation:', validated.error.issues);
  } catch (err: any) {
    console.warn('First Gemini attempt error or invalid JSON:', err.message);
  }

  // 3. Retry ONCE with error correction instruction
  try {
    console.log('Retrying Gemini generation with error correction prompt...');
    const retryPrompt = `${prompt}

IMPORTANT CORRECTION: Your previous output did not strictly conform to the required JSON schema or was not valid JSON.
Previous output snippet: ${lastRawText.substring(0, 300)}...
Please regenerate the response adhering strictly to the schema rules. Output ONLY the raw JSON object.`;

    const retryResponse = await client.models.generateContent({
      model: modelName,
      contents: retryPrompt,
      config: {
        systemInstruction,
        temperature: 0.1, // Lower temperature on retry for precision
        responseMimeType: 'application/json'
      }
    });

    const cleaned = cleanJsonResponse(retryResponse.text || '');
    const parsedJson = JSON.parse(cleaned);
    const validated = schema.safeParse(parsedJson);

    if (validated.success) {
      if (cacheKey) requestCache.set(cacheKey, validated.data);
      return validated.data;
    }

    throw new Error(`Output failed validation after retry: ${validated.error.message}`);
  } catch (error: any) {
    console.error('Gemini structured generation failed after retry:', error.message);
    throw new Error(
      'The AI assistant was unable to format its response correctly. Please try again or refine your input.'
    );
  }
}
