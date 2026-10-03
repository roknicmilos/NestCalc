import { describe, expect, it } from 'vitest';
import { calculationSchema } from './schemas';
import seed from '../data/seeds/calculator.json';

describe('calculator seed', () => {
  it('is a valid calculation', () => {
    expect(calculationSchema.safeParse(seed).success).toBe(true);
  });
});
