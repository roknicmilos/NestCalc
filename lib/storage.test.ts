import { describe, expect, it } from 'vitest';
import { CALCULATION_ID } from './config';
import { CalculationNotFoundError, readCalculation } from './storage';

describe('storage', () => {
  it('throws CalculationNotFoundError for an unknown id', async () => {
    await expect(readCalculation('does-not-exist')).rejects.toBeInstanceOf(
      CalculationNotFoundError,
    );
  });

  it('reads the configured calculation', async () => {
    const calc = await readCalculation(CALCULATION_ID);
    expect(calc.id).toBe('JqTPX58LSk');
  });
});
