import { prisma } from '@/lib/db/client';
import { anthropic, MODELS, generateStructured } from '@/lib/llm/client';
import {
  buildIntakeSystemPrompt,
  buildNextQuestionPrompt,
  buildRiskAssessmentPrompt,
  type IntakeQuestion,
} from '@/lib/llm/prompts/intake';
import { NextQuestionResponseSchema, type NextQuestionResponse } from './questions';
import { STATIC_QUESTIONS } from './questions';
import type { ApplicantProfile } from '@/lib/types/applicant';
import type { TripDetails } from '@/lib/types/trip';

export async function createIntakeSession(locale: string, applicantId?: string): Promise<string> {
  const session = await prisma.intakeSession.create({
    data: {
      locale,
      applicantId: applicantId ?? null,
      status: 'active',
      answersJson: JSON.stringify({}),
      progressPercent: 0,
    },
  });
  return session.id;
}

export async function getIntakeSession(sessionId: string) {
  return prisma.intakeSession.findUniqueOrThrow({
    where: { id: sessionId },
  });
}

export async function getNextQuestion(
  sessionId: string
): Promise<{ question: IntakeQuestion | null; progress: number; isComplete: boolean }> {
  const session = await prisma.intakeSession.findUniqueOrThrow({
    where: { id: sessionId },
  });

  const answers: Record<string, unknown> = session.answersJson
    ? (JSON.parse(session.answersJson) as Record<string, unknown>)
    : {};

  const answeredCount = Object.keys(answers).length;

  // Use static questions for the first 5 to avoid LLM latency on simple fields
  if (answeredCount < STATIC_QUESTIONS.length) {
    const staticQ = STATIC_QUESTIONS[answeredCount];
    if (staticQ) {
      // Skip if already answered
      const alreadyAnswered = answers[staticQ.field] !== undefined;
      if (!alreadyAnswered) {
        return { question: staticQ, progress: Math.round((answeredCount / 25) * 100), isComplete: false };
      }
    }
  }

  // Use Claude for dynamic follow-up questions
  const result = await generateStructured<NextQuestionResponse>({
    model: MODELS.sonnet,
    system: buildIntakeSystemPrompt(session.locale),
    messages: [
      {
        role: 'user',
        content: buildNextQuestionPrompt(answers, session.locale),
      },
    ],
    maxTokens: 1024,
    schema: (raw) => NextQuestionResponseSchema.parse(raw),
  });

  // Update consulate if determined
  if (result.consulateId && result.consulateId !== session.consulateId) {
    await prisma.intakeSession.update({
      where: { id: sessionId },
      data: { consulateId: result.consulateId },
    });
  }

  await prisma.intakeSession.update({
    where: { id: sessionId },
    data: { progressPercent: result.progressPercent },
  });

  return {
    question: result.nextQuestion,
    progress: result.progressPercent,
    isComplete: result.isComplete,
  };
}

export async function submitAnswer(
  sessionId: string,
  questionId: string,
  answer: unknown
): Promise<void> {
  const session = await prisma.intakeSession.findUniqueOrThrow({
    where: { id: sessionId },
  });

  const answers: Record<string, unknown> = session.answersJson
    ? (JSON.parse(session.answersJson) as Record<string, unknown>)
    : {};

  answers[questionId] = answer;

  await prisma.intakeSession.update({
    where: { id: sessionId },
    data: {
      answersJson: JSON.stringify(answers),
      updatedAt: new Date(),
    },
  });
}

export async function getIntakeSummary(sessionId: string): Promise<{
  applicant: Partial<ApplicantProfile>;
  trip: Partial<TripDetails>;
  consulateId: string | null;
  riskAssessment: { level: string; flags: string[] };
}> {
  const session = await prisma.intakeSession.findUniqueOrThrow({
    where: { id: sessionId },
  });

  const answers: Record<string, unknown> = session.answersJson
    ? (JSON.parse(session.answersJson) as Record<string, unknown>)
    : {};

  // Build partial profiles from answers
  const applicant: Partial<ApplicantProfile> = {};
  const trip: Partial<TripDetails> = {};

  for (const [key, value] of Object.entries(answers)) {
    if (key.startsWith('applicant.')) {
      const field = key.replace('applicant.', '') as keyof ApplicantProfile;
      (applicant as Record<string, unknown>)[field] = value;
    } else if (key.startsWith('trip.')) {
      const field = key.replace('trip.', '') as keyof TripDetails;
      (trip as Record<string, unknown>)[field] = value;
    }
  }

  // Generate risk assessment
  const riskJson = session.riskAssessmentJson;
  let riskAssessment = { level: 'unknown', flags: [] as string[] };

  if (!riskJson) {
    try {
      const riskResult = await generateStructured<{ level: string; flags: string[] }>({
        model: MODELS.sonnet,
        system: 'You are a Schengen visa risk assessor. Return only JSON.',
        messages: [
          {
            role: 'user',
            content: buildRiskAssessmentPrompt(applicant, trip),
          },
        ],
        schema: (raw) => {
          const r = raw as { level: string; flags: string[] };
          return { level: r.level ?? 'unknown', flags: r.flags ?? [] };
        },
      });
      riskAssessment = riskResult;
      await prisma.intakeSession.update({
        where: { id: sessionId },
        data: { riskAssessmentJson: JSON.stringify(riskResult) },
      });
    } catch {
      // Non-fatal — continue without risk assessment
    }
  } else {
    riskAssessment = JSON.parse(riskJson) as { level: string; flags: string[] };
  }

  return {
    applicant,
    trip,
    consulateId: session.consulateId,
    riskAssessment,
  };
}
