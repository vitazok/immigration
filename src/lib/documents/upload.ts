import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/lib/env';
import { prisma } from '@/lib/db/client';
import { extractDocumentData } from './extraction';
import type { DocumentType } from '@/lib/types/documents';

const s3 = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

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

  const fileUrl = `${env.R2_ENDPOINT}/${env.R2_BUCKET_NAME}/${storageKey}`;

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

  // Run extraction synchronously (returns quickly for MVP)
  // The client polls GET /api/documents/:id/extraction for status
  processDocument(doc.id, file, mimeType, documentType).catch((err) => {
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
}

export async function deleteDocument(documentId: string, applicantId: string): Promise<void> {
  const doc = await prisma.documentUpload.findFirst({
    where: { id: documentId, applicantId },
    select: { fileUrl: true },
  });

  if (!doc) return;

  // Extract storage key from URL
  const storageKey = doc.fileUrl.replace(`${env.R2_ENDPOINT}/${env.R2_BUCKET_NAME}/`, '');

  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: storageKey,
    })
  );

  await prisma.documentUpload.delete({ where: { id: documentId } });
}

export async function getPresignedUploadUrl(storageKey: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: storageKey,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}
