import { promises as fs } from 'node:fs';
import path from 'node:path';
import { calculationSchema } from './schemas';
import type { Calculation } from './types';

/** Machine-local "database"; git-ignored. Populated from `data/seeds/` by `npm run setup`. */
const STORAGE_DIR = path.join(process.cwd(), 'data', 'storage');
const CALCULATOR_PATH = path.join(STORAGE_DIR, 'calculator.json');
const CALCULATOR_TMP_PATH = path.join(STORAGE_DIR, '.calculator.json.tmp');

export class CalculationNotFoundError extends Error {
  constructor() {
    super(`Calculator data not found at ${CALCULATOR_PATH}. Run "npm run setup".`);
    this.name = 'CalculationNotFoundError';
  }
}

export async function readCalculation(): Promise<Calculation> {
  let raw: string;
  try {
    raw = await fs.readFile(CALCULATOR_PATH, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new CalculationNotFoundError();
    }
    throw err;
  }
  return calculationSchema.parse(JSON.parse(raw));
}

export async function writeCalculation(calc: Calculation): Promise<Calculation> {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  const validated = calculationSchema.parse(calc);
  await fs.writeFile(CALCULATOR_TMP_PATH, JSON.stringify(validated, null, 2), 'utf8');
  await fs.rename(CALCULATOR_TMP_PATH, CALCULATOR_PATH);
  return validated;
}
