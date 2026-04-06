import { prisma } from '@/lib/db/client';
import type { DocumentExtraction, DocumentType, ExtractedField } from '@/lib/types/documents';

export interface ConflictEntry {
  fieldKey: string;
  applicantColumn: string;
  currentValue: string;
  extractedValue: string;
  confidence: number;
  source: ExtractedField['source'];
  documentType: DocumentType;
}

export interface FieldProvenance {
  documentType: DocumentType;
  confidence: number;
  source: ExtractedField['source'];
  documentId: string;
}

export interface SyncResult {
  applied: Record<string, string>;
  conflicts: ConflictEntry[];
}

// Maps extraction field keys to Applicant model columns, grouped by document type
const FIELD_MAPPINGS: Record<string, Record<string, string>> = {
  passport: {
    surname: 'surname',
    givenNames: 'givenNames',
    dateOfBirth: 'dateOfBirth',
    sex: 'sex',
    nationality: 'currentNationality',
    passportNumber: 'passportNumber',
    passportExpiryDate: 'passportExpiryDate',
    passportIssueDate: 'passportIssueDate',
    passportIssuingAuthority: 'passportIssuingAuthority',
    placeOfBirth: 'placeOfBirth',
    mrzLine1: 'mrzLine1',
    mrzLine2: 'mrzLine2',
  },
  bank_statement: {
    bankName: 'bankName',
    // closingBalance and averageMonthlyBalance handled specially as JSON MoneyAmount
  },
  employer_letter: {
    employerName: 'employerName',
    jobTitle: 'jobTitle',
    employmentStartDate: 'employmentStartDate',
  },
};

// Fields that need to be wrapped as MoneyAmount JSON
const MONEY_FIELD_MAPPINGS: Record<string, { amountKey: string; currencyKey: string; column: string }> = {
  closingBalance: {
    amountKey: 'closingBalance',
    currencyKey: 'closingBalanceCurrency',
    column: 'accountBalanceJson',
  },
  averageMonthlyBalance: {
    amountKey: 'averageMonthlyBalance',
    currencyKey: 'closingBalanceCurrency', // Same currency source
    column: 'averageMonthlyBalanceJson',
  },
  monthlySalary: {
    amountKey: 'monthlySalary',
    currencyKey: 'salaryCurrency',
    column: 'monthlySalaryJson',
  },
};

/**
 * Syncs extracted document data to the Applicant record.
 * - Fills empty fields automatically
 * - Returns conflicts when a field already has a different value
 */
export async function syncExtractionToApplicant(
  applicantId: string,
  documentId: string,
  extraction: DocumentExtraction,
): Promise<SyncResult> {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
  });

  if (!applicant) {
    return { applied: {}, conflicts: [] };
  }

  const applied: Record<string, string> = {};
  const conflicts: ConflictEntry[] = [];
  const updateData: Record<string, string | boolean> = {};
  const provenance: Record<string, FieldProvenance> = parseProvenance(applicant.fieldProvenanceJson);

  const docType = extraction.documentType;
  const mappings = FIELD_MAPPINGS[docType] ?? {};

  // Handle direct field mappings
  for (const [extractionKey, applicantColumn] of Object.entries(mappings)) {
    const field = extraction.fields[extractionKey];
    if (!field || !field.value) continue;

    const currentValue = (applicant as Record<string, unknown>)[applicantColumn];
    const currentStr = currentValue != null ? String(currentValue) : '';

    if (!currentStr) {
      // Empty field — auto-fill
      updateData[applicantColumn] = field.value;
      applied[applicantColumn] = field.value;
      provenance[applicantColumn] = {
        documentType: docType,
        confidence: field.confidence,
        source: field.source,
        documentId,
      };
    } else if (currentStr !== field.value) {
      // Conflict — different value exists
      conflicts.push({
        fieldKey: extractionKey,
        applicantColumn,
        currentValue: currentStr,
        extractedValue: field.value,
        confidence: field.confidence,
        source: field.source,
        documentType: docType,
      });
    }
    // If currentStr === field.value, no action needed
  }

  // Handle MoneyAmount JSON fields
  if (docType === 'bank_statement' || docType === 'employer_letter') {
    for (const [, mapping] of Object.entries(MONEY_FIELD_MAPPINGS)) {
      const amountField = extraction.fields[mapping.amountKey];
      if (!amountField || !amountField.value) continue;

      // Only process bank_statement money fields for bank docs, employer for employer docs
      if (docType === 'bank_statement' && mapping.amountKey === 'monthlySalary') continue;
      if (docType === 'employer_letter' && mapping.amountKey !== 'monthlySalary') continue;

      const currencyField = extraction.fields[mapping.currencyKey];
      const currency = currencyField?.value ?? 'INR';
      const moneyJson = JSON.stringify({ amount: Number(amountField.value), currency });

      const currentValue = (applicant as Record<string, unknown>)[mapping.column];
      const currentStr = currentValue != null ? String(currentValue) : '';

      if (!currentStr) {
        updateData[mapping.column] = moneyJson;
        applied[mapping.column] = moneyJson;
        provenance[mapping.column] = {
          documentType: docType,
          confidence: amountField.confidence,
          source: amountField.source,
          documentId,
        };
      } else if (currentStr !== moneyJson) {
        conflicts.push({
          fieldKey: mapping.amountKey,
          applicantColumn: mapping.column,
          currentValue: currentStr,
          extractedValue: moneyJson,
          confidence: amountField.confidence,
          source: amountField.source,
          documentType: docType,
        });
      }
    }
  }

  // Write updates to DB if any fields were applied
  if (Object.keys(updateData).length > 0) {
    await prisma.applicant.update({
      where: { id: applicantId },
      data: {
        ...updateData,
        fieldProvenanceJson: JSON.stringify(provenance),
      },
    });
  }

  return { applied, conflicts };
}

function parseProvenance(json: string | null): Record<string, FieldProvenance> {
  if (!json) return {};
  try {
    return JSON.parse(json) as Record<string, FieldProvenance>;
  } catch {
    return {};
  }
}
