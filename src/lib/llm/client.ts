import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/lib/env';

// Single shared Anthropic client instance
export const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

// Model IDs — update here if Anthropic releases newer versions
export const MODELS = {
  sonnet: 'claude-sonnet-4-6',  // Used for: intake, extraction, cover letter, quality
  haiku: 'claude-haiku-4-5-20251001',   // Used for: chat assistant (speed + cost priority)
} as const;

// Default generation params
export const DEFAULT_MAX_TOKENS = 4096;
export const CHAT_MAX_TOKENS = 1024;

// Type helper for structured JSON output from Claude
export async function generateStructured<T>(params: {
  model: string;
  system: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
  schema: (raw: unknown) => T; // zod .parse() or custom validator
}): Promise<T> {
  const response = await anthropic.messages.create({
    model: params.model,
    max_tokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
    system: params.system,
    messages: params.messages,
  });

  const content = response.content[0];
  if (!content || content.type !== 'text') {
    throw new Error('LLM returned no text content');
  }

  // Strip markdown code fences if present
  const raw = content.text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`LLM returned invalid JSON: ${raw.slice(0, 200)}`);
  }

  return params.schema(parsed);
}

// Streaming helper — returns an async iterable of text chunks
export function streamText(params: {
  model: string;
  system: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
}): ReturnType<typeof anthropic.messages.stream> {
  return anthropic.messages.stream({
    model: params.model,
    max_tokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
    system: params.system,
    messages: params.messages,
  });
}
