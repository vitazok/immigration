import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { routeToConsulate } from '@/lib/intake/consulate-router';
import { getClerkUserId } from '@/lib/auth';

const BodySchema = z.object({
  nationality: z.string().length(3),  // ISO 3166-1 alpha-3
  destination: z.string().length(3),
  purpose: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());
    const userId = await getClerkUserId(req);

    // Route to consulate and get recommendation
    const recommendation = routeToConsulate({
      nationality: body.nationality,
      destination: body.destination,
      purpose: body.purpose,
    });

    // Create or find applicant if signed in
    let applicantId: string | null = null;
    if (userId) {
      const applicant = await prisma.applicant.upsert({
        where: { clerkId: userId },
        update: {},
        create: { clerkId: userId },
        select: { id: true },
      });
      applicantId = applicant.id;
    }

    // Create trip record
    const trip = await prisma.trip.create({
      data: {
        applicantId: applicantId ?? '',
        mainDestination: body.destination,
        purpose: body.purpose,
        targetConsulateId: recommendation.consulateId,
      },
    });

    // Create application record
    const application = await prisma.application.create({
      data: {
        nationality: body.nationality,
        destination: body.destination,
        purpose: body.purpose,
        consulateId: recommendation.consulateId,
        visaType: recommendation.visaType,
        visaName: recommendation.visaName,
        applicantId,
        tripId: trip.id,
        status: 'draft',
      },
    });

    return NextResponse.json({
      data: {
        applicationId: application.id,
        tripId: trip.id,
        recommendation,
      },
    });
  } catch (err) {
    console.error('[application/create]', err);
    const message = err instanceof Error ? err.message : 'Failed to create application';
    return NextResponse.json(
      { error: { code: 'APPLICATION_CREATE_FAILED', message } },
      { status: 500 }
    );
  }
}
