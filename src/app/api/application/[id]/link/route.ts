import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getClerkUserId } from '@/lib/auth';

/**
 * POST /api/application/[id]/link
 * Links the current authenticated user to an application.
 * Creates or finds an Applicant record, then updates Application.applicantId and Trip.applicantId.
 * Idempotent — safe to call multiple times.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getClerkUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Upsert applicant for this Clerk user
    const applicant = await prisma.applicant.upsert({
      where: { clerkId: userId },
      update: {},
      create: { clerkId: userId },
      select: { id: true },
    });

    // Update application if not already linked
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      select: { applicantId: true, tripId: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Application not found' } },
        { status: 404 }
      );
    }

    if (!application.applicantId) {
      await prisma.application.update({
        where: { id: params.id },
        data: { applicantId: applicant.id },
      });
    }

    // Update trip if it exists and is not linked
    if (application.tripId) {
      const trip = await prisma.trip.findUnique({
        where: { id: application.tripId },
        select: { applicantId: true },
      });
      if (trip && !trip.applicantId) {
        await prisma.trip.update({
          where: { id: application.tripId },
          data: { applicantId: applicant.id },
        });
      }
    }

    return NextResponse.json({
      data: { applicantId: applicant.id },
    });
  } catch (err) {
    console.error('[application/link]', err);
    return NextResponse.json(
      { error: { code: 'LINK_FAILED', message: 'Failed to link applicant' } },
      { status: 500 }
    );
  }
}
