export type DocumentType =
  | 'passport'
  | 'bank_statement'
  | 'employer_letter'
  | 'cover_letter'
  | 'travel_insurance'
  | 'flight_reservation'
  | 'hotel_reservation'
  | 'photo'
  | 'other';

export interface DocumentUpload {
  id: string;
  applicantId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string; // R2 URL
  mimeType: string;
  uploadedAt: string;

  extractionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  extractionResult: DocumentExtraction | null;
  extractionConfidence: number | null; // 0.0 to 1.0
}

export interface DocumentExtraction {
  documentType: DocumentType;
  fields: Record<string, ExtractedField>;
  rawText: string | null;
}

export interface ExtractedField {
  key: string;
  value: string;
  confidence: number; // 0.0 to 1.0
  source: 'mrz' | 'ocr' | 'llm_extraction' | 'manual';
  boundingBox: BoundingBox | null;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}
