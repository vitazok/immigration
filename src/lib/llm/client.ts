import OpenAI from 'openai';
import { env } from '@/lib/env';

// OpenRouter client — OpenAI-compatible API that routes to free LLMs
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: env.OPENROUTER_API_KEY,
});

// Model IDs — change these to any OpenRouter-supported model
// Browse free models at: https://openrouter.ai/models?pricing=free
export const MODELS = {
  sonnet: 'qwen/qwen3.6-plus:free',     // Used for: intake, extraction, cover letter, quality (1M ctx)
  haiku: 'qwen/qwen3.6-plus:free',      // Used for: chat assistant (same model — swap to lighter one if needed)
} as const;

// Fallback models when primary is rate-limited (429)
const FALLBACK_MODELS = [
  'openai/gpt-oss-120b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
];

// Message type compatible with OpenAI chat format
export type MessageParam = { role: 'user' | 'assistant'; content: string };

// Default generation params
export const DEFAULT_MAX_TOKENS = 4096;
export const CHAT_MAX_TOKENS = 1024;

// Shared helper: call with retry + fallback on 429
async function callWithFallback<R>(
  primaryModel: string,
  fn: (model: string) => Promise<R>
): Promise<R> {
  try {
    return await fn(primaryModel);
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status !== 429) throw err;
    console.warn(`[llm] ${primaryModel} rate-limited, trying fallbacks`);
  }

  for (const fallback of FALLBACK_MODELS) {
    try {
      return await fn(fallback);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status !== 429) throw err;
      console.warn(`[llm] ${fallback} also rate-limited, trying next`);
    }
  }

  throw new Error('All LLM models are rate-limited. Please try again in a minute.');
}

// Type helper for structured JSON output
export async function generateStructured<T>(params: {
  model: string;
  system: string;
  messages: MessageParam[];
  maxTokens?: number;
  schema: (raw: unknown) => T; // zod .parse() or custom validator
}): Promise<T> {
  return callWithFallback(params.model, async (model) => {
    const response = await openrouter.chat.completions.create({
      model,
      max_tokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
      messages: [
        { role: 'system', content: params.system },
        ...params.messages,
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('LLM returned no text content');
    }

    // Strip markdown code fences if present
    const raw = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`LLM returned invalid JSON: ${raw.slice(0, 200)}`);
    }

    return params.schema(parsed);
  });
}

// Streaming helper — yields text chunks as an async generator
export async function* streamText(params: {
  model: string;
  system: string;
  messages: MessageParam[];
  maxTokens?: number;
}): AsyncGenerator<string> {
  const models = [params.model, ...FALLBACK_MODELS];

  for (const model of models) {
    try {
      const stream = await openrouter.chat.completions.create({
        model,
        max_tokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
        messages: [
          { role: 'system', content: params.system },
          ...params.messages,
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) {
          yield text;
        }
      }
      return; // success — don't try fallbacks
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status !== 429) throw err;
      console.warn(`[llm] ${model} rate-limited, trying next`);
    }
  }

  throw new Error('All LLM models are rate-limited. Please try again in a minute.');
}
