import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { generateCoverLetter, generateCoverLetterPDF } from '@/lib/assembly/cover-letter';
import type { ApplicantProfile } from '@/lib/types/applicant';
import type { TripDetails } from '@/lib/types/trip';

const BodySchema = z.object({
  applicantId: z.string(),
  tripId: z.string(),
  riskFlags: z.array(z.string()).default([]),
  locale: z.enum(['en', 'hi', 'zh-CN']).default('en'),
  stream: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const body = BodySchema.parse(await req.json());

  try {
    const [applicantRecord, tripRecord] = await Promise.all([
      prisma.applicant.findUniqueOrThrow({ where: { id: body.applicantId } }),
      prisma.trip.findUniqueOrThrow({ where: { id: body.tripId } }),
    ]);

    const applicant = reconstructApplicant(applicantRecord);
    const trip = reconstructTrip(tripRecord);

    if (body.stream) {
      // Streaming response — client reads the text as it arrives
      const encoder = new TextEncoder();
      let fullText = '';

      const readable = new ReadableStream({
        async start(controller) {
          const { stream } = await generateCoverLetter(applicant, trip, body.riskFlags, body.locale);
          for await (const chunk of stream) {
            fullText += chunk;
            controller.enqueue(encoder.encode(chunk));
          }

          // Generate PDF after streaming completes
          const pdfUrl = await generateCoverLetterPDF(body.applicantId, fullText);
          await prisma.formState.upsert({
            where: { applicantId: body.applicantId },
            create: { applicantId: body.applicantId, coverLetterUrl: pdfUrl, coverLetterText: fullText },
            update: { coverLetterUrl: pdfUrl, coverLetterText: fullText, updatedAt: new Date() },
          });

          controller.close();
        },
      });

      return new Response(readable, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Non-streaming (for programmatic use)
    const { text } = await generateCoverLetter(applicant, trip, body.riskFlags, body.locale);
    const pdfUrl = await generateCoverLetterPDF(body.applicantId, text);

    await prisma.formState.upsert({
      where: { applicantId: body.applicantId },
      create: { applicantId: body.applicantId, coverLetterUrl: pdfUrl, coverLetterText: text },
      update: { coverLetterUrl: pdfUrl, coverLetterText: text, updatedAt: new Date() },
    });

    return NextResponse.json({ data: { coverLetterUrl: pdfUrl, coverLetterText: text } });
  } catch (err) {
    console.error('[assembly/generate-cover-letter]', err);
    return NextResponse.json(
      { error: { code: 'COVER_LETTER_FAILED', message: 'Failed to generate cover letter' } },
      { status: 500 }
    );
  }
}

function reconstructApplicant(record: Record<string, unknown>): ApplicantProfile {
  return {
    ...record,
    homeAddress: record['homeAddressJson'] ? JSON.parse(record['homeAddressJson'] as string) : null,
    employerAddress: record['employerAddressJson'] ? JSON.parse(record['employerAddressJson'] as string) : null,
    monthlySalary: record['monthlySalaryJson'] ? JSON.parse(record['monthlySalaryJson'] as string) : null,
    accountBalance: record['accountBalanceJson'] ? JSON.parse(record['accountBalanceJson'] as string) : null,
    averageMonthlyBalance: record['averageMonthlyBalanceJson'] ? JSON.parse(record['averageMonthlyBalanceJson'] as string) : null,
    previousSchengenVisas: record['previousSchengenVisasJson'] ? JSON.parse(record['previousSchengenVisasJson'] as string) : [],
  } as unknown as ApplicantProfile;
}

function reconstructTrip(record: Record<string, unknown>): TripDetails {
  return {
    ...record,
    otherDestinations: record['otherDestinations'] ? JSON.parse(record['otherDestinations'] as string) : [],
    accommodationAddress: record['accommodationAddressJson'] ? JSON.parse(record['accommodationAddressJson'] as string) : null,
    invitingPerson: record['invitingPersonJson'] ? JSON.parse(record['invitingPersonJson'] as string) : null,
    invitingOrganization: record['invitingOrganizationJson'] ? JSON.parse(record['invitingOrganizationJson'] as string) : null,
    meansOfSupport: record['meansOfSupport'] ? JSON.parse(record['meansOfSupport'] as string) : [],
  } as unknown as TripDetails;
}
