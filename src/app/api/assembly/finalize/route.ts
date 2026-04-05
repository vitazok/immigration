import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { generateFinalForm } from '@/lib/assembly/pdf-filler';

const BodySchema = z.object({
  applicantId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());

    const formState = await prisma.formState.findUniqueOrThrow({
      where: { applicantId: body.applicantId },
      select: { fieldValuesJson: true, coverLetterUrl: true },
    });

    const fieldValues: Record<string, string | boolean> = formState.fieldValuesJson
      ? JSON.parse(formState.fieldValuesJson)
      : {};

    // Generate flattened (read-only) final PDF
    const finalPdfUrl = await generateFinalForm(body.applicantId, fieldValues);

    await prisma.formState.update({
      where: { applicantId: body.applicantId },
      data: { finalPdfUrl, status: 'finalized', updatedAt: new Date() },
    });

    const packageContents = [
      'schengen-application-form.pdf',
      ...(formState.coverLetterUrl ? ['cover-letter.pdf'] : []),
    ];

    return NextResponse.json({
      data: { finalPdfUrl, packageContents },
    });
  } catch (err) {
    console.error('[assembly/finalize]', err);
    return NextResponse.json(
      { error: { code: 'FINALIZE_FAILED', message: 'Failed to finalize application' } },
      { status: 500 }
    );
  }
}
