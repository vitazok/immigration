import { describe, it, expect } from 'vitest';
import { runRuleBasedChecks } from '@/lib/quality/rules';
import { loadConsulate } from '@/lib/knowledge/loader';
import {
  STRONG_APPLICANT, STRONG_TRIP,
  FIRST_TIME_APPLICANT, FIRST_TIME_TRIP,
  RISKY_APPLICANT,
} from '../fixtures/applicant-profiles';
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

const NO_DOCS: DocumentUpload[] = [];

describe('runRuleBasedChecks — strong applicant', () => {
  it('has no blockers with full docs', () => {
    const { blockers } = runRuleBasedChecks(STRONG_APPLICANT, STRONG_TRIP, FULL_DOCS, consulate);
    expect(blockers).toHaveLength(0);
  });

  it('adds blockers for missing documents', () => {
    const { blockers } = runRuleBasedChecks(STRONG_APPLICANT, STRONG_TRIP, NO_DOCS, consulate);
    expect(blockers.some((b) => b.code === 'MISSING_PASSPORT')).toBe(true);
    expect(blockers.length).toBeGreaterThan(3);
  });
});

describe('runRuleBasedChecks — risky applicant', () => {
  it('flags insufficient funds for a 2-week trip', () => {
    const riskyTrip = { ...FIRST_TIME_TRIP, applicantId: RISKY_APPLICANT.id, durationDays: 14 };
    const { blockers } = runRuleBasedChecks(RISKY_APPLICANT, riskyTrip, FULL_DOCS, consulate);
    expect(blockers.some((b) => b.code === 'INSUFFICIENT_FUNDS')).toBe(true);
  });
});

describe('runRuleBasedChecks — first-time applicant', () => {
  it('adds cover letter recommendation for first-time travelers', () => {
    const { recommendations } = runRuleBasedChecks(FIRST_TIME_APPLICANT, FIRST_TIME_TRIP, FULL_DOCS, consulate);
    expect(recommendations.some((r) => r.code === 'FIRST_TIME_TRAVELER_COVER_LETTER')).toBe(true);
  });

  it('no blockers with adequate balance for 10-day trip (100k INR needed, 180k available)', () => {
    const { blockers } = runRuleBasedChecks(FIRST_TIME_APPLICANT, FIRST_TIME_TRIP, FULL_DOCS, consulate);
    expect(blockers.filter((b) => b.code === 'INSUFFICIENT_FUNDS')).toHaveLength(0);
  });
});

describe('runRuleBasedChecks — date validation', () => {
  it('flags departure before arrival', () => {
    const badTrip = { ...STRONG_TRIP, arrivalDate: '2026-07-24', departureDate: '2026-07-10' };
    const { blockers } = runRuleBasedChecks(STRONG_APPLICANT, badTrip, FULL_DOCS, consulate);
    expect(blockers.some((b) => b.code === 'DEPARTURE_BEFORE_ARRIVAL')).toBe(true);
  });

  it('flags stay exceeding 90 days', () => {
    const longTrip = { ...STRONG_TRIP, arrivalDate: '2026-06-01', departureDate: '2026-09-30', durationDays: 121 };
    const { blockers } = runRuleBasedChecks(STRONG_APPLICANT, longTrip, FULL_DOCS, consulate);
    expect(blockers.some((b) => b.code === 'STAY_EXCEEDS_90_DAYS')).toBe(true);
  });
});
