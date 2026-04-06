import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import type { JourneyProgress } from '@/lib/types/application';

const BodySchema = z.object({
  stepId: z.enum(['submit_vfs', 'track_decision']),
  completed: z.boolean(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = BodySchema.parse(await req.json());

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      select: { journeyProgressJson: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Application not found' } },
        { status: 404 }
      );
    }

    const progress: JourneyProgress = application.journeyProgressJson
      ? JSON.parse(application.journeyProgressJson)
      : { step4Complete: false, step5Complete: false };

    if (body.stepId === 'submit_vfs') {
      progress.step4Complete = body.completed;
    } else if (body.stepId === 'track_decision') {
      progress.step5Complete = body.completed;
    }

    await prisma.application.update({
      where: { id: params.id },
      data: { journeyProgressJson: JSON.stringify(progress) },
    });

    return NextResponse.json({ data: { progress } });
  } catch (err) {
    console.error('[application/journey-step]', err);
    return NextResponse.json(
      { error: { code: 'UPDATE_FAILED', message: 'Failed to update journey step' } },
      { status: 500 }
    );
  }
}
