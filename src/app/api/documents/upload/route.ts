import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { uploadDocument } from '@/lib/documents/upload';
import { getClerkUserId } from '@/lib/auth';
import type { DocumentType } from '@/lib/types/documents';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const DOCUMENT_TYPES: DocumentType[] = [
  'passport', 'bank_statement', 'employer_letter', 'cover_letter',
  'travel_insurance', 'flight_reservation', 'hotel_reservation', 'photo', 'other',
];

export async function POST(req: NextRequest) {
  try {
    const userId = await getClerkUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const applicantId = formData.get('applicantId') as string | null;
    const documentType = formData.get('type') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: { code: 'NO_FILE', message: 'No file provided' } },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: { code: 'INVALID_FILE_TYPE', message: `File type ${file.type} is not supported` } },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: { code: 'FILE_TOO_LARGE', message: 'File must be under 10MB' } },
        { status: 400 }
      );
    }

    if (!applicantId) {
      return NextResponse.json(
        { error: { code: 'MISSING_APPLICANT_ID', message: 'applicantId is required' } },
        { status: 400 }
      );
    }

    if (!documentType || !DOCUMENT_TYPES.includes(documentType as DocumentType)) {
      return NextResponse.json(
        { error: { code: 'INVALID_DOCUMENT_TYPE', message: `Invalid document type: ${documentType}` } },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { documentId } = await uploadDocument({
      applicantId,
      file: fileBuffer,
      fileName: file.name,
      mimeType: file.type,
      documentType: documentType as DocumentType,
    });

    return NextResponse.json(
      { data: { documentId, extractionStatus: 'processing' } },
      { status: 202 }
    );
  } catch (err) {
    console.error('[documents/upload]', err);
    return NextResponse.json(
      { error: { code: 'UPLOAD_FAILED', message: 'Document upload failed' } },
      { status: 500 }
    );
  }
}
