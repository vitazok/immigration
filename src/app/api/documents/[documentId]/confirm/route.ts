import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { syncExtractionToApplicant } from '@/lib/documents/sync-to-applicant';
import type { DocumentExtraction } from '@/lib/types/documents';

const BodySchema = z.object({
  corrections: z.record(z.string()),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const body = BodySchema.parse(await req.json());

    const doc = await prisma.documentUpload.findUniqueOrThrow({
      where: { id: params.documentId },
      select: { extractionResultJson: true, applicantId: true },
    });

    let syncResult = null;

    // Apply user corrections to extraction result
    if (doc.extractionResultJson) {
      const extraction = JSON.parse(doc.extractionResultJson) as DocumentExtraction;
      for (const [key, value] of Object.entries(body.corrections)) {
        if (extraction.fields[key]) {
          extraction.fields[key] = {
            ...extraction.fields[key],
            value,
            source: 'manual',
            confidence: 1.0,
          };
        } else {
          extraction.fields[key] = {
            key,
            value,
            confidence: 1.0,
            source: 'manual',
            boundingBox: null,
          };
        }
      }

      await prisma.documentUpload.update({
        where: { id: params.documentId },
        data: { extractionResultJson: JSON.stringify(extraction) },
      });

      // Sync corrected data to Applicant record
      if (doc.applicantId) {
        syncResult = await syncExtractionToApplicant(
          doc.applicantId,
          params.documentId,
          extraction,
        );
      }
    }

    return NextResponse.json({
      data: {
        confirmed: true,
        sync: syncResult,
      },
    });
  } catch (err) {
    console.error('[documents/confirm]', err);
    return NextResponse.json(
      { error: { code: 'CONFIRM_FAILED', message: 'Failed to confirm document' } },
      { status: 500 }
    );
  }
}
