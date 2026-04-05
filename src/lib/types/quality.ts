import type { LocalizedString } from './consulate';

export interface QualityCheckResult {
  applicationId: string;
  checkedAt: string;
  overallScore: number; // 0–100
  riskLevel: 'low' | 'medium' | 'high';

  blockers: QualityIssue[];
  warnings: QualityIssue[];
  recommendations: QualityIssue[];
}

export interface QualityIssue {
  code: string; // e.g., "MISSING_BANK_STATEMENT"
  category: 'completeness' | 'consistency' | 'financial' | 'travel_logic' | 'document_quality';
  severity: 'blocker' | 'warning' | 'recommendation';
  title: LocalizedString;
  description: LocalizedString;
  affectedFields: number[]; // Form field numbers
  suggestedAction: LocalizedString;
}
