import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createIntakeSession, getNextQuestion } from '@/lib/intake/session';

const BodySchema = z.object({
  locale: z.enum(['en', 'hi', 'zh-CN']).default('en'),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const body = BodySchema.parse(await req.json());

    const sessionId = await createIntakeSession(body.locale, userId ?? undefined);
    const { question, progress } = await getNextQuestion(sessionId);

    return NextResponse.json({
      data: { sessionId, firstQuestion: question, progress },
    });
  } catch (err) {
    console.error('[intake/start]', err);
    return NextResponse.json(
      { error: { code: 'INTAKE_START_FAILED', message: 'Failed to start intake session' } },
      { status: 500 }
    );
  }
}
