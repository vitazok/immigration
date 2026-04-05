import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { getClerkUserId } from '@/lib/auth';

const BodySchema = z.object({
  applicantId: z.string(),
  fields: z.record(z.string(), z.unknown()),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getClerkUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Sign in to save your application' } },
        { status: 401 }
      );
    }

    const body = BodySchema.parse(await req.json());

    // Update applicant fields
    const applicantUpdates: Record<string, unknown> = {};
    const tripUpdates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body.fields)) {
      if (key.startsWith('applicant.')) {
        const field = key.replace('applicant.', '');
        applicantUpdates[field] = value;
      } else if (key.startsWith('trip.')) {
        const field = key.replace('trip.', '');
        tripUpdates[field] = value;
      }
    }

    if (Object.keys(applicantUpdates).length > 0) {
      await prisma.applicant.update({
        where: { clerkId: userId },
        data: applicantUpdates,
      });
    }

    const application = await prisma.application.findUniqueOrThrow({
      where: { id: params.id },
    });

    if (Object.keys(tripUpdates).length > 0 && application.tripId) {
      await prisma.trip.update({
        where: { id: application.tripId },
        data: tripUpdates,
      });
    }

    // Update application status
    await prisma.application.update({
      where: { id: params.id },
      data: { status: 'in_progress' },
    });

    return NextResponse.json({ data: { saved: true } });
  } catch (err) {
    console.error('[application/form]', err);
    return NextResponse.json(
      { error: { code: 'FORM_SAVE_FAILED', message: 'Failed to save form data' } },
      { status: 500 }
    );
  }
}
