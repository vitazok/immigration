import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { submitAnswer, getNextQuestion } from '@/lib/intake/session';

const BodySchema = z.object({
  sessionId: z.string(),
  questionId: z.string(),
  answer: z.unknown(),
});

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());

    await submitAnswer(body.sessionId, body.questionId, body.answer);
    const { question, progress, isComplete } = await getNextQuestion(body.sessionId);

    return NextResponse.json({
      data: { nextQuestion: question, progress, isComplete },
    });
  } catch (err) {
    console.error('[intake/answer]', err);
    return NextResponse.json(
      { error: { code: 'ANSWER_FAILED', message: 'Failed to process answer' } },
      { status: 500 }
    );
  }
}
