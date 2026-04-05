import { describe, it, expect } from 'vitest';
import { parseMRZ } from '@/lib/documents/mrz';
import { MRZ_SAMPLES } from '../fixtures/mrz-samples';

describe('parseMRZ', () => {
  for (const sample of MRZ_SAMPLES) {
    it(`parses: ${sample.name}`, () => {
      const result = parseMRZ(sample.line1, sample.line2);

      expect(result.surname).toBe(sample.expected.surname);
      expect(result.givenNames).toEqual(expect.arrayContaining(sample.expected.givenNames));
      expect(result.nationality).toBe(sample.expected.nationality);
      expect(result.sex).toBe(sample.expected.sex);
    });
  }

  it('detects invalid check digit', () => {
    // Corrupt the check digit on line 2
    const line1 = 'P<INDKUMAR<<RAHUL<<<<<<<<<<<<<<<<<<<<<<<<<<<';
    const line2 = 'N12345671IND9001015M3012315<<<<<<<<<<<<<<99'; // wrong overall check digit
    const result = parseMRZ(line1, line2);
    expect(result.isValid).toBe(false);
    expect(result.checkDigitErrors.length).toBeGreaterThan(0);
  });

  it('handles names with multiple given names', () => {
    const sample = MRZ_SAMPLES.find((s) => s.name.includes('compound'))!;
    const result = parseMRZ(sample.line1, sample.line2);
    expect(result.givenNames.length).toBeGreaterThan(1);
  });
});
