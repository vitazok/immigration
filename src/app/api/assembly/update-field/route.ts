import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';

const BodySchema = z.object({
  applicantId: z.string(),
  fieldNumber: z.number().int().min(1).max(37),
  value: z.string(),
  acroFormFieldId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());

    const formState = await prisma.formState.findUnique({
      where: { applicantId: body.applicantId },
      select: { fieldValuesJson: true, userOverridesJson: true },
    });

    const fieldValues: Record<string, string | boolean> = formState?.fieldValuesJson
      ? JSON.parse(formState.fieldValuesJson)
      : {};
    const userOverrides: Record<number, string> = formState?.userOverridesJson
      ? JSON.parse(formState.userOverridesJson)
      : {};

    // Apply user override
    fieldValues[body.acroFormFieldId] = body.value;
    userOverrides[body.fieldNumber] = body.value;

    await prisma.formState.update({
      where: { applicantId: body.applicantId },
      data: {
        fieldValuesJson: JSON.stringify(fieldValues),
        userOverridesJson: JSON.stringify(userOverrides),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ data: { updated: true } });
  } catch (err) {
    console.error('[assembly/update-field]', err);
    return NextResponse.json(
      { error: { code: 'UPDATE_FAILED', message: 'Failed to update field' } },
      { status: 500 }
    );
  }
}
