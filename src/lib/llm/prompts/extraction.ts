import type { DocumentType } from '@/lib/types/documents';

export function buildPassportExtractionPrompt(ocrText: string): string {
  return `Extract structured data from the following passport OCR text.

OCR text:
${ocrText}

Extract all fields you can find. For MRZ lines (the two machine-readable lines at the bottom), parse them carefully:
- MRZ Line 1: Document type, issuing country, surname, given names
- MRZ Line 2: Passport number, nationality, DOB, sex, expiry date, personal number, check digits

For Indian passports, the format is:
Line 1: P<IND[SURNAME]<<[GIVEN NAMES]
Line 2: [PASSPORT_NO][CHECK][IND][YYYYMMDD][CHECK][SEX][YYYYMMDD][CHECK][PERSONAL_NO][CHECK][CHECK]

Respond with JSON:
{
  "fields": {
    "surname": { "value": "...", "confidence": 0.99, "source": "mrz" },
    "givenNames": { "value": "...", "confidence": 0.99, "source": "mrz" },
    "dateOfBirth": { "value": "YYYY-MM-DD", "confidence": 0.99, "source": "mrz" },
    "nationality": { "value": "IND", "confidence": 0.99, "source": "mrz" },
    "passportNumber": { "value": "...", "confidence": 0.99, "source": "mrz" },
    "passportIssueDate": { "value": "YYYY-MM-DD", "confidence": 0.9, "source": "ocr" },
    "passportExpiryDate": { "value": "YYYY-MM-DD", "confidence": 0.99, "source": "mrz" },
    "passportIssuingAuthority": { "value": "...", "confidence": 0.85, "source": "ocr" },
    "sex": { "value": "male" | "female", "confidence": 0.99, "source": "mrz" },
    "placeOfBirth": { "value": "...", "confidence": 0.8, "source": "ocr" },
    "mrzLine1": { "value": "...", "confidence": 1.0, "source": "mrz" },
    "mrzLine2": { "value": "...", "confidence": 1.0, "source": "mrz" }
  },
  "rawText": "${ocrText.slice(0, 100)}..."
}

Rules:
- Dates always in YYYY-MM-DD format
- Names always in UPPERCASE as on passport
- confidence: 1.0 = from MRZ (highly reliable), 0.7-0.9 = from OCR text, <0.7 = uncertain
- If a field is not found, omit it from the response`;
}

export function buildBankStatementExtractionPrompt(ocrText: string): string {
  return `Extract structured financial data from this Indian bank statement OCR text.

OCR text:
${ocrText}

This is likely from SBI, HDFC, or ICICI bank. Extract:
- Account holder name (exactly as printed)
- Account number (mask middle digits, keep last 4: XXXXXXXX1234)
- Bank name
- Statement period (from/to dates)
- Closing balance (the most recent balance shown)
- Average monthly balance (if shown)
- Salary/regular deposits (identify by description patterns like "SALARY", "SAL CR", "NEFT CR" + amount + date)

Respond with JSON:
{
  "fields": {
    "accountHolder": { "value": "...", "confidence": 0.95, "source": "ocr" },
    "accountNumber": { "value": "XXXXXXXX1234", "confidence": 0.9, "source": "ocr" },
    "bankName": { "value": "State Bank of India", "confidence": 0.95, "source": "ocr" },
    "statementPeriodFrom": { "value": "YYYY-MM-DD", "confidence": 0.9, "source": "ocr" },
    "statementPeriodTo": { "value": "YYYY-MM-DD", "confidence": 0.9, "source": "ocr" },
    "closingBalance": { "value": "485000", "confidence": 0.9, "source": "ocr" },
    "closingBalanceCurrency": { "value": "INR", "confidence": 1.0, "source": "ocr" },
    "averageMonthlyBalance": { "value": "420000", "confidence": 0.85, "source": "ocr" },
    "salaryDeposits": { "value": "[{\"date\":\"YYYY-MM-DD\",\"amount\":95000}]", "confidence": 0.8, "source": "llm_extraction" }
  },
  "rawText": "..."
}

Rules:
- All monetary amounts as numbers (no commas, no currency symbols)
- Dates in YYYY-MM-DD format
- If closing balance < 50000 INR per week of intended stay, flag it but still extract it`;
}

export function buildEmployerLetterExtractionPrompt(ocrText: string): string {
  return `Extract structured employment data from this Indian employer letter OCR text.

OCR text:
${ocrText}

Extract:
- Employee full name
- Company/employer name
- Job title / designation
- Employment start date
- Monthly/annual salary
- Approved leave dates for travel
- HR/manager name and signature details

Respond with JSON:
{
  "fields": {
    "employeeName": { "value": "...", "confidence": 0.9, "source": "ocr" },
    "employerName": { "value": "...", "confidence": 0.95, "source": "ocr" },
    "jobTitle": { "value": "...", "confidence": 0.9, "source": "ocr" },
    "employmentStartDate": { "value": "YYYY-MM-DD", "confidence": 0.8, "source": "ocr" },
    "monthlySalary": { "value": "95000", "confidence": 0.85, "source": "ocr" },
    "salaryCurrency": { "value": "INR", "confidence": 1.0, "source": "ocr" },
    "leaveFrom": { "value": "YYYY-MM-DD", "confidence": 0.8, "source": "ocr" },
    "leaveTo": { "value": "YYYY-MM-DD", "confidence": 0.8, "source": "ocr" }
  },
  "rawText": "..."
}`;
}

export function buildDocumentClassificationPrompt(ocrText: string): string {
  return `Classify the document type based on this OCR text excerpt.

OCR text (first 500 chars):
${ocrText.slice(0, 500)}

Respond with JSON:
{
  "documentType": "passport" | "bank_statement" | "employer_letter" | "cover_letter" | "travel_insurance" | "flight_reservation" | "hotel_reservation" | "photo" | "other",
  "confidence": 0.0-1.0,
  "reason": "Brief explanation"
}`;
}

export function getExtractionPrompt(docType: DocumentType, ocrText: string): string {
  switch (docType) {
    case 'passport':
      return buildPassportExtractionPrompt(ocrText);
    case 'bank_statement':
      return buildBankStatementExtractionPrompt(ocrText);
    case 'employer_letter':
      return buildEmployerLetterExtractionPrompt(ocrText);
    default:
      return buildDocumentClassificationPrompt(ocrText);
  }
}
