import type { DocumentType } from './documents';

export interface FormFieldMapping {
  fieldNumber: number; // 1–37
  fieldLabel: string;
  acroFormFieldId: string; // Real PDF AcroForm field name from CS_14076-05_EN_05.pdf
  fieldType: 'text' | 'checkbox' | 'radio' | 'date';

  dataSource: DataSource;
  transformRule: string | null; // e.g., "DD/MM/YYYY", "UPPERCASE", "COUNTRY_NAME"

  // For review UI
  confidenceLevel: 'high' | 'medium' | 'low';
  tooltipKey: string;
}

export type DataSource =
  | { type: 'applicant'; path: string } // e.g., "surname"
  | { type: 'trip'; path: string } // e.g., "mainDestination"
  | { type: 'extraction'; docType: DocumentType; field: string }
  | { type: 'computed'; rule: string } // e.g., "determineDuration", "currentDate"
  | { type: 'manual' }; // User must fill
