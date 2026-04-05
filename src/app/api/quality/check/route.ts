import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { runQualityCheck } from '@/lib/quality/checker';
import type { ApplicantProfile } from '@/lib/types/applicant';
import type { TripDetails } from '@/lib/types/trip';
import type { DocumentUpload } from '@/lib/types/documents';

const BodySchema = z.object({
  applicantId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());

    const [applicantRecord, trips, documentsRaw] = await Promise.all([
      prisma.applicant.findUniqueOrThrow({ where: { id: body.applicantId } }),
      prisma.trip.findMany({
        where: { applicantId: body.applicantId },
        orderBy: { createdAt: 'desc' },
        take: 1,
      }),
      prisma.documentUpload.findMany({
        where: { applicantId: body.applicantId },
        select: { id: true, type: true, extractionStatus: true, extractionResultJson: true, extractionConfidence: true, applicantId: true, fileName: true, fileUrl: true, mimeType: true, uploadedAt: true },
      }),
    ]);

    const tripRecord = trips[0];

    // Reconstruct typed objects
    const applicant = reconstructApplicant(applicantRecord);
    const trip = tripRecord ? reconstructTrip(tripRecord) : {};
    const documents: DocumentUpload[] = documentsRaw.map((d) => ({
      id: d.id,
      applicantId: d.applicantId,
      type: d.type as DocumentUpload['type'],
      fileName: d.fileName,
      fileUrl: d.fileUrl,
      mimeType: d.mimeType,
      uploadedAt: d.uploadedAt.toISOString(),
      extractionStatus: d.extractionStatus as DocumentUpload['extractionStatus'],
      extractionResult: d.extractionResultJson ? JSON.parse(d.extractionResultJson) : null,
      extractionConfidence: d.extractionConfidence,
    }));

    const consulateId = (trip as Partial<TripDetails>).targetConsulateId ?? 'FR_NEW_DELHI';

    const result = await runQualityCheck(
      body.applicantId,
      applicant,
      trip as Partial<TripDetails>,
      documents,
      consulateId
    );

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error('[quality/check]', err);
    return NextResponse.json(
      { error: { code: 'QUALITY_CHECK_FAILED', message: 'Quality check failed' } },
      { status: 500 }
    );
  }
}

function reconstructApplicant(record: Record<string, unknown>): Partial<ApplicantProfile> {
  return {
    ...record,
    homeAddress: record['homeAddressJson'] ? JSON.parse(record['homeAddressJson'] as string) : undefined,
    employerAddress: record['employerAddressJson'] ? JSON.parse(record['employerAddressJson'] as string) : undefined,
    monthlySalary: record['monthlySalaryJson'] ? JSON.parse(record['monthlySalaryJson'] as string) : undefined,
    accountBalance: record['accountBalanceJson'] ? JSON.parse(record['accountBalanceJson'] as string) : undefined,
    previousSchengenVisas: record['previousSchengenVisasJson'] ? JSON.parse(record['previousSchengenVisasJson'] as string) : [],
  } as Partial<ApplicantProfile>;
}

function reconstructTrip(record: Record<string, unknown>): Partial<TripDetails> {
  return {
    ...record,
    otherDestinations: record['otherDestinations'] ? JSON.parse(record['otherDestinations'] as string) : [],
    accommodationAddress: record['accommodationAddressJson'] ? JSON.parse(record['accommodationAddressJson'] as string) : undefined,
    invitingPerson: record['invitingPersonJson'] ? JSON.parse(record['invitingPersonJson'] as string) : undefined,
    invitingOrganization: record['invitingOrganizationJson'] ? JSON.parse(record['invitingOrganizationJson'] as string) : undefined,
    meansOfSupport: record['meansOfSupport'] ? JSON.parse(record['meansOfSupport'] as string) : [],
  } as Partial<TripDetails>;
}
