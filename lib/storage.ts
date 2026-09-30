import { promises as fs } from 'node:fs';
import path from 'node:path';
import { calculationSchema } from './schemas';
import type { Calculation } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function calculationPath(id: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new Error(`Invalid calculation id: ${id}`);
  }
  return path.join(DATA_DIR, `${id}.json`);
}

export class CalculationNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`Calculation not found: ${id}`);
    this.name = 'CalculationNotFoundError';
  }
}

export async function readCalculation(id: string): Promise<Calculation> {
  await ensureDataDir();
  const file = calculationPath(id);
  let raw: string;
  try {
    raw = await fs.readFile(file, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new CalculationNotFoundError(id);
    }
    throw err;
  }
  const parsed = JSON.parse(raw);
  return calculationSchema.parse(parsed);
}

export async function writeCalculation(calc: Calculation): Promise<Calculation> {
  await ensureDataDir();
  const validated = calculationSchema.parse(calc);
  const finalPath = calculationPath(validated.id);
  const tmpPath = path.join(DATA_DIR, `.${validated.id}.json.tmp`);
  const content = JSON.stringify(validated, null, 2);
  await fs.writeFile(tmpPath, content, 'utf8');
  await fs.rename(tmpPath, finalPath);
  return validated;
}
