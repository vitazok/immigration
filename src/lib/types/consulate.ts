import type { DocumentType } from './documents';
import type { MoneyAmount } from './applicant';

export interface ConsulateRequirement {
  consulateId: string; // e.g., "FR_NEW_DELHI"
  country: string;
  city: string;
  countryCode: string; // ISO 3166-1 alpha-3

  vfsProvider: 'vfs_global' | 'tls_contact' | 'bls_international';
  appointmentBookingUrl: string;

  requiredDocuments: DocumentRequirement[];

  financialThresholdMin: MoneyAmount;
  bankStatementMonths: number;

  photoSpec: {
    width: number; // mm
    height: number; // mm
    background: string;
    standard: string; // "ICAO"
  };

  processingTimeDays: { min: number; max: number };

  knownPractices: string[];

  lastVerifiedDate: string; // YYYY-MM-DD
  refusalRateEstimate: number; // 0.0 to 1.0

  fees?: {
    visaFee: MoneyAmount;
    vfsServiceCharge: MoneyAmount;
    note: LocalizedString;
  };
  vfsTrackingUrl?: string;

  formFieldOverrides: Record<string, string>;

  tooltips: Record<string, LocalizedString>;
  faqs: FaqEntry[];
}

export interface DocumentRequirement {
  documentType: DocumentType;
  required: boolean;
  description: LocalizedString;
  notes: LocalizedString | null;
  templateUrl: string | null;
}

export interface LocalizedString {
  en: string;
  hi: string;
  'zh-CN'?: string; // Optional — added when Chinese locale is enabled
}

export interface FaqEntry {
  wizardStep: string;
  question: LocalizedString;
  answer: LocalizedString;
  order: number;
}
