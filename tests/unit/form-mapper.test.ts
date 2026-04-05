import { describe, it, expect } from 'vitest';
import { mapApplicationToFormFields } from '@/lib/assembly/form-mapper';
import { STRONG_APPLICANT, STRONG_TRIP } from '../fixtures/applicant-profiles';

describe('mapApplicationToFormFields', () => {
  it('maps surname to applicantSurname in uppercase', () => {
    const fields = mapApplicationToFormFields(STRONG_APPLICANT, STRONG_TRIP);
    expect(fields['applicantSurname']).toBe('KUMAR');
  });

  it('maps given names to applicantFirstname in uppercase', () => {
    const fields = mapApplicationToFormFields(STRONG_APPLICANT, STRONG_TRIP);
    expect(fields['applicantFirstname']).toBe('RAHUL');
  });

  it('formats date of birth as DD/MM/YYYY', () => {
    const fields = mapApplicationToFormFields(STRONG_APPLICANT, STRONG_TRIP);
    expect(fields['applicantDateOfBirth']).toBe('01/01/1990');
  });

  it('sets ordinary passport type checkbox', () => {
    const fields = mapApplicationToFormFields(STRONG_APPLICANT, STRONG_TRIP);
    expect(fields['travelDocTypePSP']).toBe(true);
  });

  it('maps tourism purpose to purposeTOUR', () => {
    const fields = mapApplicationToFormFields(STRONG_APPLICANT, STRONG_TRIP);
    expect(fields['purposeTOUR']).toBe(true);
    expect(fields['purposeVISF']).toBeFalsy();
  });

  it('maps single entry to entries1', () => {
    const fields = mapApplicationToFormFields(STRONG_APPLICANT, STRONG_TRIP);
    expect(fields['entries1']).toBe(true);
    expect(fields['entries2']).toBe(false);
    expect(fields['entriesM']).toBe(false);
  });

  it('maps arrival and departure dates as DD/MM/YYYY', () => {
    const fields = mapApplicationToFormFields(STRONG_APPLICANT, STRONG_TRIP);
    expect(fields['dateOfArrival']).toBe('10/07/2026');
    expect(fields['dateOfDeparture']).toBe('24/07/2026');
  });

  it('sets N/A for national identity number (Indian applicants)', () => {
    const fields = mapApplicationToFormFields(STRONG_APPLICANT, STRONG_TRIP);
    expect(fields['applicantIdCardNumber']).toBe('N/A');
  });

  it('maps self-funded trip to sponsorTypeM', () => {
    const fields = mapApplicationToFormFields(STRONG_APPLICANT, STRONG_TRIP);
    expect(fields['sponsorTypeM']).toBe(true);
  });

  it('maps accommodation to host1Names', () => {
    const fields = mapApplicationToFormFields(STRONG_APPLICANT, STRONG_TRIP);
    expect(fields['host1Names']).toBe('Hotel Le Marais Paris');
  });
});
