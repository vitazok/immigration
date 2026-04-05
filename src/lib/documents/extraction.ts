import { z } from 'zod';
import { MODELS, generateStructured } from '@/lib/llm/client';
import { getExtractionPrompt } from '@/lib/llm/prompts/extraction';
import { parseMRZ } from './mrz';
import { extractTextFromImage } from './ocr';
import type { DocumentExtraction, DocumentType, ExtractedField } from '@/lib/types/documents';

// Zod schema for LLM extraction output
const ExtractedFieldSchema = z.object({
  value: z.string(),
  confidence: z.number().min(0).max(1),
  source: z.enum(['mrz', 'ocr', 'llm_extraction', 'manual']),
});

const ExtractionOutputSchema = z.object({
  fields: z.record(ExtractedFieldSchema),
  rawText: z.string().nullable().optional(),
});

export async function extractDocumentData(
  imageBase64: string,
  mimeType: string,
  documentType: DocumentType
): Promise<DocumentExtraction> {
  // Step 1: OCR
  const ocr = await extractTextFromImage(imageBase64, mimeType);

  // Step 2: For passports, attempt MRZ extraction first (most reliable)
  let mrzFields: Record<string, ExtractedField> = {};
  if (documentType === 'passport') {
    mrzFields = extractMRZFromText(ocr.fullText);
  }

  // Step 3: LLM extraction for remaining fields
  let llmFields: Record<string, ExtractedField> = {};

  // Retry logic: attempt once, retry with stricter prompt on failure
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await generateStructured<z.infer<typeof ExtractionOutputSchema>>({
        model: MODELS.sonnet,
        system: `You are a document data extraction specialist. Extract structured data from the provided OCR text. Return ONLY valid JSON matching the requested schema. Be precise — do not invent data that is not present.${attempt > 0 ? ' IMPORTANT: Return strictly valid JSON only, no additional text.' : ''}`,
        messages: [
          {
            role: 'user',
            content: getExtractionPrompt(documentType, ocr.fullText),
          },
        ],
        schema: (raw) => ExtractionOutputSchema.parse(raw),
      });

      llmFields = Object.fromEntries(
        Object.entries(result.fields).map(([key, field]) => [
          key,
          {
            key,
            value: field.value,
            confidence: field.confidence,
            source: field.source,
            boundingBox: null,
          } satisfies ExtractedField,
        ])
      );
      break;
    } catch (err) {
      if (attempt === 1) {
        // Second attempt failed — log and continue with MRZ-only data
        console.error('[extraction] LLM extraction failed after retry:', err);
      }
    }
  }

  // Step 4: Merge — MRZ fields win over LLM fields (higher confidence)
  const mergedFields: Record<string, ExtractedField> = {
    ...llmFields,
    ...mrzFields,
  };

  return {
    documentType,
    fields: mergedFields,
    rawText: ocr.fullText,
  };
}

function extractMRZFromText(text: string): Record<string, ExtractedField> {
  // Look for two consecutive lines matching MRZ format
  const lines = text.split('\n').map((l) => l.trim().replace(/\s/g, ''));
  const mrzLine1Pattern = /^P[<A-Z]{1}[A-Z]{3}[A-Z<]{39}$/;
  const mrzLine2Pattern = /^[A-Z0-9<]{9}[0-9]{1}[A-Z]{3}[0-9]{6}[0-9]{1}[MF<]{1}[0-9]{6}[0-9]{1}[A-Z0-9<]{14}[0-9<]{1}[0-9]{1}$/;

  let line1 = '';
  let line2 = '';

  for (let i = 0; i < lines.length - 1; i++) {
    const current = lines[i] ?? '';
    const next = lines[i + 1] ?? '';
    if (current.length >= 44 && next.length >= 44) {
      // Check if either line matches MRZ pattern
      const candidate1 = current.slice(0, 44);
      const candidate2 = next.slice(0, 44);
      if (mrzLine1Pattern.test(candidate1) || candidate1.startsWith('P<')) {
        line1 = candidate1;
        line2 = candidate2;
        break;
      }
    }
  }

  if (!line1 || !line2) return {};

  try {
    const parsed = parseMRZ(line1, line2);
    const fields: Record<string, ExtractedField> = {};

    const add = (key: string, value: string) => {
      if (value) {
        fields[key] = { key, value, confidence: 0.99, source: 'mrz', boundingBox: null };
      }
    };

    add('surname', parsed.surname);
    add('givenNames', parsed.givenNames.join(' '));
    add('dateOfBirth', parsed.dateOfBirth);
    add('nationality', parsed.nationality);
    add('passportNumber', parsed.documentNumber);
    add('passportExpiryDate', parsed.expiryDate);
    add('sex', parsed.sex);
    add('mrzLine1', line1);
    add('mrzLine2', line2);

    return fields;
  } catch {
    return {};
  }
}
