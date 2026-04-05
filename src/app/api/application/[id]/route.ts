import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getConsulate } from '@/lib/knowledge/queries';
import type { VisaRecommendation } from '@/lib/types/application';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const application = await prisma.application.findUniqueOrThrow({
      where: { id: params.id },
    });

    // Load consulate data for recommendation + document checklist
    const consulate = getConsulate(application.consulateId);

    const recommendation: VisaRecommendation = {
      consulateId: application.consulateId,
      visaType: application.visaType,
      visaName: application.visaName,
      consulateName: `Embassy of ${consulate.country}, ${consulate.city}`,
      vfsProvider: consulate.vfsProvider,
      processingDays: consulate.processingTimeDays,
      refusalRate: consulate.refusalRateEstimate,
      requiredDocCount: consulate.requiredDocuments.filter((d: { required: boolean }) => d.required).length,
    };

    // Load documents uploaded for this applicant
    let documents: { type: string; extractionStatus: string; id: string }[] = [];
    if (application.applicantId) {
      documents = await prisma.documentUpload.findMany({
        where: { applicantId: application.applicantId },
        select: { id: true, type: true, extractionStatus: true },
      });
    }

    // Load form state
    let formFields: Record<string, string> = {};
    let formFieldsFilled = 0;
    if (application.applicantId) {
      const formState = await prisma.formState.findUnique({
        where: { applicantId: application.applicantId },
      });
      if (formState?.fieldValuesJson) {
        formFields = JSON.parse(formState.fieldValuesJson) as Record<string, string>;
        formFieldsFilled = Object.values(formFields).filter((v) => v.trim() !== '').length;
      }
    }

    // Load applicant + trip data for form prefill
    let applicant = null;
    if (application.applicantId) {
      applicant = await prisma.applicant.findUnique({
        where: { id: application.applicantId },
      });
    }

    let trip = null;
    if (application.tripId) {
      trip = await prisma.trip.findUnique({
        where: { id: application.tripId },
      });
    }

    return NextResponse.json({
      data: {
        application: {
          id: application.id,
          status: application.status,
          nationality: application.nationality,
          destination: application.destination,
          purpose: application.purpose,
          visaName: application.visaName,
        },
        recommendation,
        requiredDocuments: consulate.requiredDocuments,
        documents,
        formFields,
        formFieldsFilled,
        formFieldsTotal: 37,
        applicant,
        trip,
      },
    });
  } catch (err) {
    console.error('[application/get]', err);
    return NextResponse.json(
      { error: { code: 'APPLICATION_NOT_FOUND', message: 'Application not found' } },
      { status: 404 }
    );
  }
}
