import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { mapApplicationToFormFields, getFieldMappings } from '@/lib/assembly/form-mapper';
import { generatePreviewForm } from '@/lib/assembly/pdf-filler';
import type { ApplicantProfile } from '@/lib/types/applicant';
import type { TripDetails } from '@/lib/types/trip';

const BodySchema = z.object({
  applicantId: z.string(),
  tripId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());

    const [applicantRecord, tripRecord] = await Promise.all([
      prisma.applicant.findUniqueOrThrow({ where: { id: body.applicantId } }),
      prisma.trip.findUniqueOrThrow({ where: { id: body.tripId } }),
    ]);

    // Reconstruct typed objects from DB JSON fields
    const applicant = reconstructApplicant(applicantRecord);
    const trip = reconstructTrip(tripRecord);

    const fieldValues = mapApplicationToFormFields(applicant, trip);
    const formUrl = await generatePreviewForm(body.applicantId, fieldValues);

    // Save form state
    await prisma.formState.upsert({
      where: { applicantId: body.applicantId },
      create: {
        applicantId: body.applicantId,
        fieldValuesJson: JSON.stringify(fieldValues),
        status: 'draft',
      },
      update: {
        fieldValuesJson: JSON.stringify(fieldValues),
        status: 'reviewing',
        updatedAt: new Date(),
      },
    });

    // Determine which fields need review (confidence < high or source = manual)
    const mappings = getFieldMappings();
    const fieldsNeedingReview = mappings
      .filter((m) => m.confidenceLevel !== 'high')
      .map((m) => m.fieldNumber);

    return NextResponse.json({
      data: { formUrl, fieldMappings: mappings, fieldsNeedingReview },
    });
  } catch (err) {
    console.error('[assembly/generate-form]', err);
    return NextResponse.json(
      { error: { code: 'FORM_GEN_FAILED', message: 'Failed to generate form' } },
      { status: 500 }
    );
  }
}

// Helpers to reconstruct typed objects from flat DB records
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
