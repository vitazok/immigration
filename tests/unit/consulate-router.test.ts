import { describe, it, expect } from 'vitest';
import { routeToConsulate } from '@/lib/intake/consulate-router';

describe('routeToConsulate', () => {
  it('routes IND → FRA to FR_NEW_DELHI with correct visa type', () => {
    const result = routeToConsulate({
      nationality: 'IND',
      destination: 'FRA',
      purpose: 'tourism',
    });

    expect(result.consulateId).toBe('FR_NEW_DELHI');
    expect(result.visaType).toBe('schengen_c');
    expect(result.visaName).toBe('Schengen Type C Tourist Visa');
  });

  it('returns recommendation with consulate metadata from knowledge base', () => {
    const result = routeToConsulate({
      nationality: 'IND',
      destination: 'FRA',
      purpose: 'tourism',
    });

    expect(result.consulateName).toContain('France');
    expect(result.consulateName).toContain('New Delhi');
    expect(result.vfsProvider).toBe('vfs_global');
    expect(result.processingDays).toEqual({ min: 15, max: 30 });
    expect(result.refusalRate).toBeGreaterThan(0);
    expect(result.refusalRate).toBeLessThan(1);
  });

  it('returns correct required document count (8 required docs)', () => {
    const result = routeToConsulate({
      nationality: 'IND',
      destination: 'FRA',
      purpose: 'tourism',
    });

    expect(result.requiredDocCount).toBe(8);
  });

  it('works for all supported purposes', () => {
    const purposes = ['tourism', 'visiting_family', 'business', 'cultural', 'medical', 'study', 'transit'];

    for (const purpose of purposes) {
      const result = routeToConsulate({
        nationality: 'IND',
        destination: 'FRA',
        purpose,
      });
      // All purposes route to same consulate in MVP
      expect(result.consulateId).toBe('FR_NEW_DELHI');
    }
  });

  it('throws for unsupported nationality → destination combination', () => {
    expect(() =>
      routeToConsulate({
        nationality: 'USA',
        destination: 'FRA',
        purpose: 'tourism',
      })
    ).toThrow('Unsupported combination');
  });

  it('throws for unsupported destination', () => {
    expect(() =>
      routeToConsulate({
        nationality: 'IND',
        destination: 'DEU',
        purpose: 'tourism',
      })
    ).toThrow('Unsupported combination');
  });
});
