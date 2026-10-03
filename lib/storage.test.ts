import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculationSchema } from './schemas';
import seed from '../data/seeds/calculator.json';

describe('calculator seed', () => {
  it('is a valid calculation', () => {
    expect(calculationSchema.safeParse(seed).success).toBe(true);
  });
});

describe('storage directory override', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'nestcalc-storage-'));
    vi.stubEnv('NESTCALC_DATA_DIR', dir);
    vi.resetModules();
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('writes and reads calculator.json under NESTCALC_DATA_DIR', async () => {
    const { readCalculation, writeCalculation } = await import('./storage');
    await writeCalculation(calculationSchema.parse(seed));

    await expect(fs.stat(path.join(dir, 'calculator.json'))).resolves.toBeDefined();
    expect((await readCalculation()).id).toBe(seed.id);
  });

  it('reports the configured path when the file is missing', async () => {
    const { readCalculation, CalculationNotFoundError } = await import('./storage');
    const err = await readCalculation().catch((e) => e);

    expect(err).toBeInstanceOf(CalculationNotFoundError);
    expect(err.message).toContain(dir);
  });
});
