import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/lib/env';
import { prisma } from '@/lib/db/client';
import { extractDocumentData } from './extraction';
import { syncExtractionToApplicant } from './sync-to-applicant';
import type { DocumentType } from '@/lib/types/documents';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';

const isR2Configured = !env.R2_ENDPOINT.includes('PLACEHOLDER');

const s3 = isR2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

const LOCAL_UPLOAD_DIR = join(process.cwd(), '.uploads');

export async function uploadDocument(params: {
  applicantId: string;
  file: Buffer;
  fileName: string;
  mimeType: string;
  documentType: DocumentType;
}): Promise<{ documentId: string; fileUrl: string }> {
  const { applicantId, file, fileName, mimeType, documentType } = params;

  // Generate a unique storage key
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageKey = `documents/${applicantId}/${timestamp}_${sanitizedName}`;

  let fileUrl: string;

  if (s3) {
    // Upload to R2
    await s3.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: storageKey,
        Body: file,
        ContentType: mimeType,
        Metadata: {
          applicantId,
          documentType,
        },
      })
    );
    fileUrl = `${env.R2_ENDPOINT}/${env.R2_BUCKET_NAME}/${storageKey}`;
  } else {
    // Local filesystem fallback for development
    const localPath = join(LOCAL_UPLOAD_DIR, storageKey);
    await mkdir(join(LOCAL_UPLOAD_DIR, 'documents', applicantId), { recursive: true });
    await writeFile(localPath, file);
    fileUrl = `file://${localPath}`;
    console.log(`[upload] R2 not configured — saved locally: ${localPath}`);
  }

  // Create database record
  const doc = await prisma.documentUpload.create({
    data: {
      applicantId,
      type: documentType,
      fileName,
      fileUrl,
      mimeType,
      extractionStatus: 'processing',
    },
  });

  // Run extraction asynchronously — client polls GET /api/documents/:id/extraction for status
  processDocument(doc.id, applicantId, file, mimeType, documentType).catch((err) => {
    console.error(`[upload] Extraction failed for document ${doc.id}:`, err);
    prisma.documentUpload.update({
      where: { id: doc.id },
      data: { extractionStatus: 'failed' },
    }).catch(() => null);
  });

  return { documentId: doc.id, fileUrl };
}

async function processDocument(
  documentId: string,
  applicantId: string,
  file: Buffer,
  mimeType: string,
  documentType: DocumentType
): Promise<void> {
  const imageBase64 = file.toString('base64');

  const extraction = await extractDocumentData(imageBase64, mimeType, documentType);

  const avgConfidence =
    Object.values(extraction.fields).reduce((sum, f) => sum + f.confidence, 0) /
    Math.max(Object.values(extraction.fields).length, 1);

  await prisma.documentUpload.update({
    where: { id: documentId },
    data: {
      extractionStatus: 'completed',
      extractionResultJson: JSON.stringify(extraction),
      extractionConfidence: avgConfidence,
    },
  });

  // Auto-sync extracted fields to Applicant record (fills empty fields only)
  if (applicantId) {
    try {
      const result = await syncExtractionToApplicant(applicantId, documentId, extraction);
      if (Object.keys(result.applied).length > 0) {
        console.log(`[upload] Auto-synced ${Object.keys(result.applied).length} fields from ${documentType} to applicant ${applicantId}`);
      }
      if (result.conflicts.length > 0) {
        console.log(`[upload] ${result.conflicts.length} conflicts detected for applicant ${applicantId}`);
      }
    } catch (err) {
      console.error(`[upload] Sync to applicant failed for document ${documentId}:`, err);
      // Non-fatal — extraction still saved, sync can be retried
    }
  }
}

export async function deleteDocument(documentId: string, applicantId: string): Promise<void> {
  const doc = await prisma.documentUpload.findFirst({
    where: { id: documentId, applicantId },
    select: { fileUrl: true },
  });

  if (!doc) return;

  if (doc.fileUrl.startsWith('file://')) {
    // Local file — delete from filesystem
    try {
      await unlink(doc.fileUrl.replace('file://', ''));
    } catch { /* file may already be gone */ }
  } else if (s3) {
    // R2 file — delete from S3
    const storageKey = doc.fileUrl.replace(`${env.R2_ENDPOINT}/${env.R2_BUCKET_NAME}/`, '');
    await s3.send(
      new DeleteObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: storageKey,
      })
    );
  }

  await prisma.documentUpload.delete({ where: { id: documentId } });
}

export async function getPresignedUploadUrl(storageKey: string): Promise<string> {
  if (!s3) {
    // In local dev, return a placeholder — presigned URLs aren't used in the upload flow
    return `file://${join(LOCAL_UPLOAD_DIR, storageKey)}`;
  }
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: storageKey,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}
