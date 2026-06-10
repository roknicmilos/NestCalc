import { promises as fs } from 'node:fs';
import path from 'node:path';
import { calculationSchema } from './schemas';
import type { Calculation, CalculationSummary } from './types';

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

export async function listCalculations(): Promise<CalculationSummary[]> {
  await ensureDataDir();
  const entries = await fs.readdir(DATA_DIR);
  const summaries: CalculationSummary[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.json') || entry.startsWith('.')) continue;
    const id = entry.slice(0, -'.json'.length);
    try {
      const calc = await readCalculation(id);
      summaries.push({ id: calc.id, name: calc.name, updatedAt: calc.updatedAt });
    } catch {
      // Skip files that fail to parse — they're not valid calculations.
    }
  }
  summaries.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return summaries;
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

export async function deleteCalculation(id: string): Promise<void> {
  const file = calculationPath(id);
  try {
    await fs.unlink(file);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new CalculationNotFoundError(id);
    }
    throw err;
  }
}

export async function calculationExists(id: string): Promise<boolean> {
  try {
    await fs.access(calculationPath(id));
    return true;
  } catch {
    return false;
  }
}
