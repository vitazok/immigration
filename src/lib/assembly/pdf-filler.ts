import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFCheckBox, PDFRadioGroup, PDFTextField } from 'pdf-lib';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '@/lib/env';

const s3 = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

// The blank form lives at public/forms/schengen-form.pdf
// Copy CS_14076-05_EN_05.pdf there before running.
function getBlankFormPath(): string {
  return path.join(process.cwd(), 'public', 'forms', 'schengen-form.pdf');
}

export async function fillForm(
  fieldValues: Record<string, string | boolean>,
  flatten = false
): Promise<Uint8Array> {
  const formPath = getBlankFormPath();
  if (!fs.existsSync(formPath)) {
    throw new Error(
      'Schengen form not found at public/forms/schengen-form.pdf. ' +
      'Please copy CS_14076-05_EN_05.pdf to that location.'
    );
  }

  const formBytes = fs.readFileSync(formPath);
  const pdfDoc = await PDFDocument.load(formBytes);
  const form = pdfDoc.getForm();

  for (const [fieldId, value] of Object.entries(fieldValues)) {
    try {
      const field = form.getField(fieldId);

      if (field instanceof PDFTextField) {
        field.setText(typeof value === 'string' ? value : String(value));
      } else if (field instanceof PDFCheckBox) {
        if (value === true) {
          field.check();
        } else {
          field.uncheck();
        }
      } else if (field instanceof PDFRadioGroup) {
        // Radio groups: value is the option name
        if (typeof value === 'string') {
          field.select(value);
        }
      }
    } catch {
      // Field not found in this PDF version — skip silently, log for debugging
      if (process.env['NODE_ENV'] === 'development') {
        console.warn(`[pdf-filler] Field not found: ${fieldId}`);
      }
    }
  }

  if (flatten) {
    form.flatten();
  }

  return pdfDoc.save();
}

export async function uploadFilledForm(
  applicantId: string,
  pdfBytes: Uint8Array,
  fileName: string
): Promise<string> {
  const storageKey = `generated/${applicantId}/${Date.now()}_${fileName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: storageKey,
      Body: Buffer.from(pdfBytes),
      ContentType: 'application/pdf',
    })
  );

  return `${env.R2_ENDPOINT}/${env.R2_BUCKET_NAME}/${storageKey}`;
}

export async function generatePreviewForm(
  applicantId: string,
  fieldValues: Record<string, string | boolean>
): Promise<string> {
  const pdfBytes = await fillForm(fieldValues, false); // Not flattened — editable
  return uploadFilledForm(applicantId, pdfBytes, 'schengen-preview.pdf');
}

export async function generateFinalForm(
  applicantId: string,
  fieldValues: Record<string, string | boolean>
): Promise<string> {
  const pdfBytes = await fillForm(fieldValues, true); // Flattened — read-only
  return uploadFilledForm(applicantId, pdfBytes, 'schengen-final.pdf');
}
