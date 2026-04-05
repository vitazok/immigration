import { describe, it, expect } from 'vitest';
import { parseMRZ } from '@/lib/documents/mrz';
import { mapApplicationToFormFields } from '@/lib/assembly/form-mapper';
import { runRuleBasedChecks } from '@/lib/quality/rules';
import { loadConsulate } from '@/lib/knowledge/loader';
import {
  STRONG_APPLICANT,
  STRONG_TRIP,
  FIRST_TIME_APPLICANT,
  FIRST_TIME_TRIP,
  RISKY_APPLICANT,
} from '../fixtures/applicant-profiles';
import { MRZ_SAMPLES } from '../fixtures/mrz-samples';
import { BANK_STATEMENT_FIXTURES } from '../fixtures/bank-statements';
import type { DocumentUpload } from '@/lib/types/documents';

const consulate = loadConsulate('FR_NEW_DELHI');

const FULL_DOCS: DocumentUpload[] = [
  'passport', 'bank_statement', 'employer_letter', 'travel_insurance',
  'flight_reservation', 'hotel_reservation', 'photo', 'cover_letter',
].map((type) => ({
  id: `doc_${type}`,
  applicantId: 'test',
  type: type as DocumentUpload['type'],
  fileName: `${type}.pdf`,
  fileUrl: `https://example.com/${type}.pdf`,
  mimeType: 'application/pdf',
  uploadedAt: '2026-01-01T00:00:00Z',
  extractionStatus: 'completed' as const,
  extractionResult: null,
  extractionConfidence: 0.9,
}));

// Integration test: full pipeline from MRZ → profile → form fields → quality check.
// This exercises the same path the real app takes, without hitting LLM or database.

describe('Full pipeline: Strong applicant', () => {
  const mrzSample = MRZ_SAMPLES[0]!; // Male applicant, simple name — matches STRONG_APPLICANT
  const bankData = BANK_STATEMENT_FIXTURES[0]!; // SBI — strong

  it('Step 1: MRZ extraction produces valid parsed data', () => {
    const mrz = parseMRZ(mrzSample.line1, mrzSample.line2);
    expect(mrz.surname).toBe('KUMAR');
    expect(mrz.givenNames).toContain('RAHUL');
    expect(mrz.nationality).toBe('IND');
    expect(mrz.documentNumber).toBe('N1234567');
    expect(mrz.sex).toBe('male');
  });

  it('Step 2: MRZ data matches applicant profile fields', () => {
    const mrz = parseMRZ(mrzSample.line1, mrzSample.line2);
    expect(mrz.surname).toBe(STRONG_APPLICANT.surname);
    expect(mrz.documentNumber).toBe(STRONG_APPLICANT.passportNumber);
    expect(mrz.nationality).toBe(STRONG_APPLICANT.currentNationality);
  });

  it('Step 3: Bank statement confirms adequate finances', () => {
    expect(bankData.data.closingBalance).toBe(STRONG_APPLICANT.accountBalance!.amount);
    expect(bankData.data.accountHolder).toBe(`${STRONG_APPLICANT.givenNames} ${STRONG_APPLICANT.surname}`);
    // 14-day trip at 50k/week → min 100k. Balance 485k is well above.
    expect(bankData.data.closingBalance).toBeGreaterThan(100000);
  });

  it('Step 4: Form mapping produces correct field values', () => {
    const fields = mapApplicationToFormFields(STRONG_APPLICANT, STRONG_TRIP);

    // Personal data
    expect(fields['applicantSurname']).toBe('KUMAR');
    expect(fields['applicantFirstname']).toBe('RAHUL');
    expect(fields['applicantDateOfBirth']).toBe('01/01/1990');
    expect(fields['applicantPlaceOfBirth']).toBe('Mumbai');
    expect(fields['applicantCountryOfBirth']).toBe('India');
    expect(fields['applicantNationality']).toBe('India');
    expect(fields['applicantGenderM']).toBe(true);
    expect(fields['applicantGenderF']).toBe(false);
    expect(fields['applicantMaritalMAR']).toBe(true);

    // Passport
    expect(fields['travelDocTypePSP']).toBe(true);
    expect(fields['travelDocNumber']).toBe('N1234567');

    // Trip
    expect(fields['purposeTOUR']).toBe(true);
    expect(fields['applicantDestinations']).toBe('France');
    expect(fields['entries1']).toBe(true);
    expect(fields['dateOfArrival']).toBe('10/07/2026');
    expect(fields['dateOfDeparture']).toBe('24/07/2026');

    // Accommodation
    expect(fields['host1Names']).toBe('Hotel Le Marais Paris');

    // Self-funded
    expect(fields['sponsorTypeM']).toBe(true);
    expect(fields['fundingTypeM_ARG']).toBe(true); // cash
    expect(fields['fundingTypeM_CCR']).toBe(true); // credit card
  });

  it('Step 5: Quality check passes with no blockers', () => {
    const result = runRuleBasedChecks(STRONG_APPLICANT, STRONG_TRIP, FULL_DOCS, consulate);
    expect(result.blockers).toHaveLength(0);
  });

  it('Step 5b: Quality check has no warnings about funds (485k for 2 weeks)', () => {
    const result = runRuleBasedChecks(STRONG_APPLICANT, STRONG_TRIP, FULL_DOCS, consulate);
    expect(result.warnings.filter((w) => w.category === 'financial')).toHaveLength(0);
  });
});

describe('Full pipeline: First-time applicant', () => {
  const mrzSample = MRZ_SAMPLES[1]!; // Female, compound name — matches FIRST_TIME_APPLICANT
  const bankData = BANK_STATEMENT_FIXTURES[1]!; // HDFC — adequate

  it('MRZ matches profile', () => {
    const mrz = parseMRZ(mrzSample.line1, mrzSample.line2);
    expect(mrz.surname).toBe(FIRST_TIME_APPLICANT.surname);
    expect(mrz.documentNumber).toBe(FIRST_TIME_APPLICANT.passportNumber);
    expect(mrz.sex).toBe('female');
  });

  it('Form mapping produces correct fields', () => {
    const fields = mapApplicationToFormFields(FIRST_TIME_APPLICANT, FIRST_TIME_TRIP);
    expect(fields['applicantSurname']).toBe('SINGH');
    expect(fields['applicantFirstname']).toBe('PRIYA');
    expect(fields['applicantMaritalCEL']).toBe(true);
    expect(fields['applicantGenderF']).toBe(true);
    expect(fields['dateOfArrival']).toBe('15/06/2026');
    expect(fields['dateOfDeparture']).toBe('25/06/2026');
    expect(fields['formerBiometricVisa']).toBe('No');
    expect(fields['hasFingerprintsTrue']).toBe(false);
    expect(fields['hasFingerprintsFalse']).toBe(true);
  });

  it('Quality check recommends cover letter but has no blockers', () => {
    const result = runRuleBasedChecks(FIRST_TIME_APPLICANT, FIRST_TIME_TRIP, FULL_DOCS, consulate);
    expect(result.blockers).toHaveLength(0);
    expect(result.recommendations.some((r) => r.code === 'FIRST_TIME_TRAVELER_COVER_LETTER')).toBe(true);
  });

  it('Bank balance (180k) is adequate for 10-day trip (min 100k)', () => {
    expect(bankData.data.closingBalance).toBeGreaterThanOrEqual(100000);
    const result = runRuleBasedChecks(FIRST_TIME_APPLICANT, FIRST_TIME_TRIP, FULL_DOCS, consulate);
    expect(result.blockers.filter((b) => b.code === 'INSUFFICIENT_FUNDS')).toHaveLength(0);
  });
});

describe('Full pipeline: Risky applicant', () => {
  const mrzSample = MRZ_SAMPLES[2]!; // Long surname — matches RISKY_APPLICANT
  const bankData = BANK_STATEMENT_FIXTURES[2]!; // ICICI — below threshold

  it('MRZ matches profile', () => {
    const mrz = parseMRZ(mrzSample.line1, mrzSample.line2);
    expect(mrz.surname).toBe(RISKY_APPLICANT.surname);
    expect(mrz.documentNumber).toBe(RISKY_APPLICANT.passportNumber);
  });

  it('Bank balance (45k) is below threshold for 2-week trip (min 100k)', () => {
    expect(bankData.data.closingBalance).toBe(45000);
    expect(bankData.data.closingBalance).toBeLessThan(100000);
  });

  it('Quality check flags insufficient funds', () => {
    const riskyTrip = { ...FIRST_TIME_TRIP, applicantId: RISKY_APPLICANT.id, durationDays: 14 };
    const result = runRuleBasedChecks(RISKY_APPLICANT, riskyTrip, FULL_DOCS, consulate);
    expect(result.blockers.some((b) => b.code === 'INSUFFICIENT_FUNDS')).toBe(true);
  });

  it('Quality check recommends cover letter for first-time traveler', () => {
    const riskyTrip = { ...FIRST_TIME_TRIP, applicantId: RISKY_APPLICANT.id, durationDays: 14 };
    const result = runRuleBasedChecks(RISKY_APPLICANT, riskyTrip, FULL_DOCS, consulate);
    expect(result.recommendations.some((r) => r.code === 'FIRST_TIME_TRAVELER_COVER_LETTER')).toBe(true);
  });

  it('Irregular salary deposits: no consistent monthly pattern', () => {
    const deposits = bankData.data.salaryDeposits;
    // Has Feb gap — only Jan and Mar deposits
    const months = deposits.map((d) => new Date(d.date).getMonth());
    expect(months).not.toContain(1); // No February deposit
  });
});

describe('Cross-cutting: MRZ variants → form field consistency', () => {
  for (const sample of MRZ_SAMPLES) {
    it(`${sample.name}: parsed surname matches expected`, () => {
      const mrz = parseMRZ(sample.line1, sample.line2);
      expect(mrz.surname).toBe(sample.expected.surname);
    });
  }

  it('Expired passport is detected by quality check', () => {
    const expiredSample = MRZ_SAMPLES[3]!; // Expired passport
    const mrz = parseMRZ(expiredSample.line1, expiredSample.line2);

    // Create applicant with expired passport
    const expiredApplicant = {
      ...STRONG_APPLICANT,
      passportExpiryDate: mrz.expiryDate, // 2022-12-31 — expired
    };

    const result = runRuleBasedChecks(expiredApplicant, STRONG_TRIP, FULL_DOCS, consulate);
    expect(result.blockers.some((b) => b.code === 'PASSPORT_EXPIRY_TOO_SOON')).toBe(true);
  });
});

describe('Cross-cutting: Missing documents → quality blockers', () => {
  it('No documents at all → multiple blockers', () => {
    const result = runRuleBasedChecks(STRONG_APPLICANT, STRONG_TRIP, [], consulate);
    expect(result.blockers.length).toBeGreaterThan(3);
    expect(result.blockers.some((b) => b.code === 'MISSING_PASSPORT')).toBe(true);
    expect(result.blockers.some((b) => b.code === 'MISSING_BANK_STATEMENT')).toBe(true);
  });

  it('Partial documents → only missing ones are flagged', () => {
    const partialDocs = FULL_DOCS.filter((d) => d.type === 'passport' || d.type === 'photo');
    const result = runRuleBasedChecks(STRONG_APPLICANT, STRONG_TRIP, partialDocs, consulate);

    expect(result.blockers.some((b) => b.code === 'MISSING_PASSPORT')).toBe(false);
    expect(result.blockers.some((b) => b.code === 'MISSING_PHOTO')).toBe(false);
    expect(result.blockers.some((b) => b.code === 'MISSING_BANK_STATEMENT')).toBe(true);
  });
});
