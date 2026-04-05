import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(
  _req: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const doc = await prisma.documentUpload.findUniqueOrThrow({
      where: { id: params.documentId },
      select: {
        extractionStatus: true,
        extractionResultJson: true,
        extractionConfidence: true,
      },
    });

    const result = doc.extractionResultJson
      ? JSON.parse(doc.extractionResultJson)
      : null;

    return NextResponse.json({
      data: {
        status: doc.extractionStatus,
        result,
        confidence: doc.extractionConfidence,
      },
    });
  } catch (err) {
    console.error('[documents/extraction]', err);
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Document not found' } },
      { status: 404 }
    );
  }
}
