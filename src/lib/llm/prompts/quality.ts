import type { ApplicantProfile } from '@/lib/types/applicant';
import type { TripDetails } from '@/lib/types/trip';
import type { DocumentUpload } from '@/lib/types/documents';
import type { ConsulateRequirement } from '@/lib/types/consulate';

export function buildQualityCheckPrompt(
  applicant: Partial<ApplicantProfile>,
  trip: Partial<TripDetails>,
  documents: DocumentUpload[],
  consulate: ConsulateRequirement
): string {
  const docTypes = documents.map((d) => d.type);
  const requiredDocs = consulate.requiredDocuments.filter((d) => d.required).map((d) => d.documentType);
  const missingDocs = requiredDocs.filter((d) => !docTypes.includes(d));

  return `You are a senior Schengen visa officer reviewing this application package for completeness and consistency.

CONSULATE: ${consulate.country} Embassy, ${consulate.city}
REFUSAL RATE: ${(consulate.refusalRateEstimate * 100).toFixed(0)}%

APPLICANT:
${JSON.stringify(applicant, null, 2)}

TRIP:
${JSON.stringify(trip, null, 2)}

DOCUMENTS UPLOADED: ${docTypes.join(', ') || 'none'}
MISSING REQUIRED DOCUMENTS: ${missingDocs.join(', ') || 'none'}

FINANCIAL THRESHOLD: ${consulate.financialThresholdMin.amount} ${consulate.financialThresholdMin.currency} per week of stay
REQUIRED STAY DURATION: ${trip.durationDays ?? 0} days
MINIMUM REQUIRED BALANCE: ${((trip.durationDays ?? 0) / 7) * consulate.financialThresholdMin.amount} ${consulate.financialThresholdMin.currency}

KNOWN CONSULATE PRACTICES:
${consulate.knownPractices.map((p) => `- ${p}`).join('\n')}

Review for:
1. COMPLETENESS: Are all required fields filled? All required documents uploaded?
2. CONSISTENCY: Do dates match across form, flight, insurance, hotel? Does name spelling match across all documents?
3. FINANCIAL: Is the bank balance sufficient? Is income pattern regular?
4. TRAVEL LOGIC: Are arrival/departure dates logical? Is the stated purpose consistent with the documents?
5. DOCUMENT QUALITY: Any obvious issues with documents provided?

Respond with JSON matching this structure exactly:
{
  "overallScore": 0-100,
  "riskLevel": "low" | "medium" | "high",
  "blockers": [
    {
      "code": "MISSING_BANK_STATEMENT",
      "category": "completeness",
      "severity": "blocker",
      "title": { "en": "...", "hi": "..." },
      "description": { "en": "...", "hi": "..." },
      "affectedFields": [33],
      "suggestedAction": { "en": "...", "hi": "..." }
    }
  ],
  "warnings": [...],
  "recommendations": [...]
}

Score guide:
- 90-100: Strong application, low risk
- 70-89: Acceptable, minor issues
- 50-69: Significant concerns, high risk of refusal
- <50: Likely refusal without major corrections`;
}
