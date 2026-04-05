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

export async function extractTextFromImage(imageBase64: string, mimeType: string): Promise<OCRResult> {
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
