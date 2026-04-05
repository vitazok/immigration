import { describe, it, expect } from 'vitest';
import { routeToConsulate } from '@/lib/intake/consulate-router';
import { mapApplicationToFormFields } from '@/lib/assembly/form-mapper';
import { runRuleBasedChecks } from '@/lib/quality/rules';
import { loadConsulate } from '@/lib/knowledge/loader';
import { getRequiredDocuments } from '@/lib/knowledge/queries';
import {
  STRONG_APPLICANT,
  STRONG_TRIP,
  FIRST_TIME_APPLICANT,
  FIRST_TIME_TRIP,
  RISKY_APPLICANT,
} from '../fixtures/applicant-profiles';
import type { VisaRecommendation } from '@/lib/types/application';
import type { DocumentUpload } from '@/lib/types/documents';

// Integration test: new application flow
// Onboarding → consulate routing → document checklist → form mapping → quality check
// No DB or HTTP — exercises the pure logic layers end to end.

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

describe('New flow: Onboarding → Consulate routing', () => {
  it('Step 1: 3-dropdown input produces VisaRecommendation', () => {
    // Simulates the POST /api/application/create logic without DB
    const recommendation = routeToConsulate({
      nationality: 'IND',
      destination: 'FRA',
      purpose: 'tourism',
    });

    // Recommendation has all fields the UI needs
    expect(recommendation.consulateId).toBeTruthy();
    expect(recommendation.visaType).toBeTruthy();
    expect(recommendation.visaName).toBeTruthy();
    expect(recommendation.consulateName).toBeTruthy();
    expect(recommendation.vfsProvider).toBeTruthy();
    expect(recommendation.processingDays.min).toBeGreaterThan(0);
    expect(recommendation.processingDays.max).toBeGreaterThan(recommendation.processingDays.min);
    expect(recommendation.refusalRate).toBeGreaterThan(0);
    expect(recommendation.requiredDocCount).toBeGreaterThan(0);
  });

  it('Step 2: Recommendation resolves to valid consulate with document checklist', () => {
    const recommendation = routeToConsulate({
      nationality: 'IND',
      destination: 'FRA',
      purpose: 'tourism',
    });

    const requiredDocs = getRequiredDocuments(recommendation.consulateId);

    expect(requiredDocs.length).toBe(recommendation.requiredDocCount);
    expect(requiredDocs.every((d) => d.required)).toBe(true);

    // All expected doc types present
    const docTypes = requiredDocs.map((d) => d.documentType);
    expect(docTypes).toContain('passport');
    expect(docTypes).toContain('bank_statement');
    expect(docTypes).toContain('travel_insurance');
    expect(docTypes).toContain('flight_reservation');
    expect(docTypes).toContain('hotel_reservation');
  });

  it('Step 2b: Each document has localized descriptions (en + hi)', () => {
    const recommendation = routeToConsulate({
      nationality: 'IND',
      destination: 'FRA',
      purpose: 'tourism',
    });

    const requiredDocs = getRequiredDocuments(recommendation.consulateId);

    for (const doc of requiredDocs) {
      expect(doc.description.en).toBeTruthy();
      expect(doc.description.hi).toBeTruthy();
    }
  });
});

describe('New flow: Dashboard → Form sections → Quality check (strong applicant)', () => {
  let recommendation: VisaRecommendation;

  // Step 1: Onboarding
  recommendation = routeToConsulate({
    nationality: 'IND',
    destination: 'FRA',
    purpose: 'tourism',
  });

  it('Step 3: Form mapping populates all 6 sections', () => {
    const fields = mapApplicationToFormFields(STRONG_APPLICANT, STRONG_TRIP);

    // Personal Details section
    expect(fields['applicantSurname']).toBe('KUMAR');
    expect(fields['applicantFirstname']).toBe('RAHUL');
    expect(fields['applicantGenderM']).toBe(true);
    expect(fields['applicantMaritalMAR']).toBe(true);

    // Passport section
    expect(fields['travelDocNumber']).toBe('N1234567');
    expect(fields['travelDocTypePSP']).toBe(true);

    // Travel Plans section
    expect(fields['applicantDestinations']).toBe('France');
    expect(fields['purposeTOUR']).toBe(true);
    expect(fields['dateOfArrival']).toBeTruthy();
    expect(fields['dateOfDeparture']).toBeTruthy();

    // Accommodation
    expect(fields['host1Names']).toBeTruthy();

    // Funding
    expect(fields['sponsorTypeM']).toBe(true);
  });

  it('Step 4: Quality check passes with full documents + strong profile', () => {
    const consulate = loadConsulate(recommendation.consulateId);
    const result = runRuleBasedChecks(STRONG_APPLICANT, STRONG_TRIP, FULL_DOCS, consulate);

    expect(result.blockers).toHaveLength(0);
    expect(result.warnings.filter((w) => w.category === 'financial')).toHaveLength(0);
  });
});

describe('New flow: Dashboard → Quality check (first-time applicant)', () => {
  it('Form maps correctly for first-time traveler', () => {
    const fields = mapApplicationToFormFields(FIRST_TIME_APPLICANT, FIRST_TIME_TRIP);

    expect(fields['applicantSurname']).toBe('SINGH');
    expect(fields['applicantGenderF']).toBe(true);
    expect(fields['applicantMaritalCEL']).toBe(true);
    expect(fields['formerBiometricVisa']).toBe('No');
    expect(fields['hasFingerprintsFalse']).toBe(true);
  });

  it('Quality check recommends cover letter but no blockers', () => {
    const recommendation = routeToConsulate({
      nationality: 'IND',
      destination: 'FRA',
      purpose: 'tourism',
    });
    const consulate = loadConsulate(recommendation.consulateId);
    const result = runRuleBasedChecks(FIRST_TIME_APPLICANT, FIRST_TIME_TRIP, FULL_DOCS, consulate);

    expect(result.blockers).toHaveLength(0);
    expect(result.recommendations.some((r) => r.code === 'FIRST_TIME_TRAVELER_COVER_LETTER')).toBe(true);
  });
});

describe('New flow: Dashboard → Quality check (risky applicant)', () => {
  it('Quality check flags financial blockers', () => {
    const recommendation = routeToConsulate({
      nationality: 'IND',
      destination: 'FRA',
      purpose: 'tourism',
    });
    const consulate = loadConsulate(recommendation.consulateId);
    const riskyTrip = { ...FIRST_TIME_TRIP, applicantId: RISKY_APPLICANT.id, durationDays: 14 };
    const result = runRuleBasedChecks(RISKY_APPLICANT, riskyTrip, FULL_DOCS, consulate);

    expect(result.blockers.some((b) => b.code === 'INSUFFICIENT_FUNDS')).toBe(true);
  });

  it('Missing documents produce blockers in dashboard context', () => {
    const recommendation = routeToConsulate({
      nationality: 'IND',
      destination: 'FRA',
      purpose: 'tourism',
    });
    const consulate = loadConsulate(recommendation.consulateId);
    const riskyTrip = { ...FIRST_TIME_TRIP, applicantId: RISKY_APPLICANT.id, durationDays: 14 };

    // Only passport uploaded — rest missing
    const partialDocs = FULL_DOCS.filter((d) => d.type === 'passport');
    const result = runRuleBasedChecks(RISKY_APPLICANT, riskyTrip, partialDocs, consulate);

    expect(result.blockers.some((b) => b.code === 'MISSING_BANK_STATEMENT')).toBe(true);
    expect(result.blockers.some((b) => b.code === 'MISSING_PASSPORT')).toBe(false); // passport is present
  });
});

describe('New flow: Progress calculation', () => {
  it('Document progress: 0 of N when no docs uploaded', () => {
    const recommendation = routeToConsulate({
      nationality: 'IND',
      destination: 'FRA',
      purpose: 'tourism',
    });
    const requiredDocs = getRequiredDocuments(recommendation.consulateId);
    const uploadedCount = 0;
    const progress = uploadedCount / requiredDocs.length;

    expect(progress).toBe(0);
    expect(requiredDocs.length).toBe(8);
  });

  it('Document progress: N of N when all docs uploaded', () => {
    const recommendation = routeToConsulate({
      nationality: 'IND',
      destination: 'FRA',
      purpose: 'tourism',
    });
    const requiredDocs = getRequiredDocuments(recommendation.consulateId);
    const uploadedCount = requiredDocs.length;
    const progress = uploadedCount / requiredDocs.length;

    expect(progress).toBe(1);
  });

  it('Form field progress: strong applicant has all key fields filled', () => {
    const fields = mapApplicationToFormFields(STRONG_APPLICANT, STRONG_TRIP);
    const filledCount = Object.values(fields).filter((v) => v !== '' && v !== null && v !== undefined).length;

    // Strong applicant should have most fields filled
    expect(filledCount).toBeGreaterThan(15);
  });
});
