// ICAO 9303 Machine Readable Zone (MRZ) parser for Type P (passport)
// Line 1: P<[ISSUING_STATE][SURNAME]<<[GIVEN_NAMES]
// Line 2: [DOC_NO][CHECK][NATIONALITY][DOB][CHECK][SEX][EXPIRY][CHECK][PERSONAL_NO][CHECK][OVERALL_CHECK]

export interface ParsedMRZ {
  documentType: string;
  issuingState: string;
  surname: string;
  givenNames: string[];
  documentNumber: string;
  nationality: string;
  dateOfBirth: string;      // YYYY-MM-DD
  sex: 'male' | 'female' | 'unknown';
  expiryDate: string;       // YYYY-MM-DD
  personalNumber: string | null;
  isValid: boolean;
  checkDigitErrors: string[];
}

const MRZ_CHAR_VALUES: Record<string, number> = {};
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((c, i) => {
  MRZ_CHAR_VALUES[c] = i + 10;
});
'0123456789'.split('').forEach((c, i) => {
  MRZ_CHAR_VALUES[c] = i;
});
MRZ_CHAR_VALUES['<'] = 0;

const WEIGHTS = [7, 3, 1];

function computeCheckDigit(str: string): number {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i]?.toUpperCase() ?? '<';
    const value = MRZ_CHAR_VALUES[char] ?? 0;
    sum += value * (WEIGHTS[i % 3] ?? 1);
  }
  return sum % 10;
}

function parseMRZDate(yymmdd: string): string {
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = yymmdd.slice(2, 4);
  const dd = yymmdd.slice(4, 6);

  // Two-digit year: 00-30 = 2000-2030, 31-99 = 1931-1999
  const year = yy <= 30 ? 2000 + yy : 1900 + yy;
  return `${year}-${mm}-${dd}`;
}

export function parseMRZ(line1: string, line2: string): ParsedMRZ {
  const errors: string[] = [];
  const l1 = line1.trim().padEnd(44, '<');
  const l2 = line2.trim().padEnd(44, '<');

  // Line 1 parsing
  const documentType = l1.slice(0, 1);
  const issuingState = l1.slice(2, 5).replace(/<+$/, '');
  const nameField = l1.slice(5, 44);
  const nameParts = nameField.split('<<');
  const surname = (nameParts[0] ?? '').replace(/<+/g, ' ').trim();
  const givenNameRaw = nameParts.slice(1).join(' ');
  const givenNames = givenNameRaw
    .split('<')
    .map((n) => n.trim())
    .filter(Boolean);

  // Line 2 parsing
  const documentNumber = l2.slice(0, 9).replace(/<+$/, '');
  const docCheckDigit = parseInt(l2[9] ?? '0', 10);
  const nationality = l2.slice(10, 13).replace(/<+$/, '');
  const dobRaw = l2.slice(13, 19);
  const dobCheckDigit = parseInt(l2[19] ?? '0', 10);
  const sexChar = l2[20] ?? '<';
  const expiryRaw = l2.slice(21, 27);
  const expiryCheckDigit = parseInt(l2[27] ?? '0', 10);
  const personalNumber = l2.slice(28, 42).replace(/<+/g, '').trim() || null;
  const personalCheckDigit = parseInt(l2[42] ?? '0', 10);
  const overallCheckDigit = parseInt(l2[43] ?? '0', 10);

  // Validate check digits
  if (computeCheckDigit(documentNumber) !== docCheckDigit) {
    errors.push('Document number check digit mismatch');
  }
  if (computeCheckDigit(dobRaw) !== dobCheckDigit) {
    errors.push('Date of birth check digit mismatch');
  }
  if (computeCheckDigit(expiryRaw) !== expiryCheckDigit) {
    errors.push('Expiry date check digit mismatch');
  }

  const overallStr = l2.slice(0, 10) + l2.slice(13, 20) + l2.slice(21, 43);
  if (computeCheckDigit(overallStr) !== overallCheckDigit) {
    errors.push('Overall check digit mismatch');
  }

  const sex: 'male' | 'female' | 'unknown' =
    sexChar === 'M' ? 'male' : sexChar === 'F' ? 'female' : 'unknown';

  return {
    documentType,
    issuingState,
    surname,
    givenNames,
    documentNumber,
    nationality,
    dateOfBirth: parseMRZDate(dobRaw),
    sex,
    expiryDate: parseMRZDate(expiryRaw),
    personalNumber,
    isValid: errors.length === 0,
    checkDigitErrors: errors,
  };
}
