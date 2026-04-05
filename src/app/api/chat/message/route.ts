import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MODELS, streamText } from '@/lib/llm/client';
import { buildChatSystemPrompt, buildChatUserContext } from '@/lib/llm/prompts/chat';
import { getConsulate } from '@/lib/knowledge/queries';

const BodySchema = z.object({
  sessionId: z.string(),
  applicantId: z.string().nullable(),
  currentStep: z.string(),
  message: z.string().max(1000),
  locale: z.enum(['en', 'hi', 'zh-CN']).default('en'),
  recentMessages: z
    .array(z.object({ role: z.string(), content: z.string() }))
    .max(5)
    .default([]),
  applicationContext: z.record(z.unknown()).default({}),
});

// Simple in-memory rate limiter: max 20 messages per session per hour
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(sessionId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(sessionId);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(sessionId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 20) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());

    if (isRateLimited(body.sessionId)) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many messages. Please wait before sending more.' } },
        { status: 429 }
      );
    }

    let consulateData = null;
    try {
      consulateData = getConsulate('FR_NEW_DELHI');
    } catch {
      // Consulate data unavailable — continue without it
    }

    const systemPrompt = buildChatSystemPrompt(consulateData, body.currentStep, body.locale);
    const userContent = buildChatUserContext(body.applicationContext, [
      ...body.recentMessages,
      { role: 'user', content: body.message },
    ]);

    // Stream response back to client
    const encoder = new TextEncoder();
    const stream = streamText({
      model: MODELS.haiku,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
      maxTokens: 512,
    });

    const readable = new ReadableStream({
      async start(controller) {
        for await (const text of stream) {
          controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    console.error('[chat/message]', err);
    return NextResponse.json(
      { error: { code: 'CHAT_FAILED', message: 'Chat request failed' } },
      { status: 500 }
    );
  }
}
