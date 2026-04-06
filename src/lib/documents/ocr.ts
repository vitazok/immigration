import { env } from '@/lib/env';

interface VisionAnnotation {
  description: string;
  boundingPoly?: {
    vertices: Array<{ x: number; y: number }>;
  };
}

interface VisionResponse {
  responses: Array<{
    fullTextAnnotation?: {
      text: string;
    };
    textAnnotations?: VisionAnnotation[];
    error?: {
      message: string;
      code: number;
    };
  }>;
}

export interface OCRResult {
  fullText: string;
  confidence: number;
  words: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

const isVisionConfigured = !env.GOOGLE_CLOUD_VISION_API_KEY.includes('PLACEHOLDER');

export async function extractTextFromImage(imageBase64: string, mimeType: string): Promise<OCRResult> {
  if (!isVisionConfigured) {
    return devFallbackOCR(imageBase64, mimeType);
  }

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${env.GOOGLE_CLOUD_VISION_API_KEY}`;

  const body = {
    requests: [
      {
        image: {
          content: imageBase64,
        },
        features: [
          { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
        ],
        imageContext: {
          languageHints: ['en', 'hi'],
        },
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Google Vision API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as VisionResponse;
  const result = data.responses[0];

  if (!result) {
    throw new Error('No response from Google Vision API');
  }

  if (result.error) {
    throw new Error(`Google Vision error: ${result.error.message}`);
  }

  const fullText = result.fullTextAnnotation?.text ?? '';

  // Extract word-level annotations for bounding boxes
  const words = (result.textAnnotations ?? [])
    .slice(1) // First annotation is the full text block
    .map((annotation) => {
      const vertices = annotation.boundingPoly?.vertices ?? [];
      const x = Math.min(...vertices.map((v) => v.x ?? 0));
      const y = Math.min(...vertices.map((v) => v.y ?? 0));
      const width = Math.max(...vertices.map((v) => v.x ?? 0)) - x;
      const height = Math.max(...vertices.map((v) => v.y ?? 0)) - y;
      return {
        text: annotation.description,
        x,
        y,
        width,
        height,
      };
    });

  // Estimate overall confidence from text length heuristic
  // Vision API doesn't return a single confidence score for DOCUMENT_TEXT_DETECTION
  const confidence = fullText.length > 50 ? 0.9 : fullText.length > 10 ? 0.7 : 0.3;

  return { fullText, confidence, words };
}

/**
 * Dev-only fallback when Google Vision API is not configured.
 * Returns a synthetic MRZ text for passport uploads so the extraction pipeline
 * can be tested end-to-end without a real OCR service.
 */
function devFallbackOCR(_imageBase64: string, _mimeType: string): OCRResult {
  console.warn('[ocr] Google Vision not configured — using dev fallback with sample MRZ');

  // Sample passport text with MRZ lines (fictional data from test fixtures)
  const samplePassportText = [
    'REPUBLIC OF INDIA',
    'PASSPORT',
    '',
    'Surname: KUMAR',
    'Given Names: RAHUL',
    'Nationality: Indian',
    'Date of Birth: 01 JAN 1990',
    'Sex: M',
    'Place of Birth: NEW DELHI',
    'Date of Issue: 01 JAN 2025',
    'Date of Expiry: 31 DEC 2030',
    'Passport No: N1234567',
    '',
    'P<INDKUMAR<<RAHUL<<<<<<<<<<<<<<<<<<<<<<<<<<<',
    'N1234567<7IND9001011M3012316<<<<<<<<<<<<<<04',
  ].join('\n');

  return {
    fullText: samplePassportText,
    confidence: 0.95,
    words: [],
  };
}
