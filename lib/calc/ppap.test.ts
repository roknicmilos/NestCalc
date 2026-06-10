import { describe, expect, it } from 'vitest';
import { computePpap } from './ppap';

describe('computePpap', () => {
  it('charges 2.5% for an individual seller', () => {
    expect(computePpap(230000, 'INDIVIDUAL')).toBeCloseTo(5750, 6);
  });

  it('charges 0 for an investor', () => {
    expect(computePpap(230000, 'INVESTOR')).toBe(0);
  });
});
