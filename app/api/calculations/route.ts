import { NextResponse } from 'next/server';
import { createDefaultCalculation } from '@/lib/defaults';
import { createCalculationBodySchema } from '@/lib/schemas';
import { listCalculations, writeCalculation } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  const summaries = await listCalculations();
  return NextResponse.json(summaries);
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Telo zahteva mora biti JSON.' }, { status: 400 });
  }
  const parsed = createCalculationBodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Neispravan zahtev.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const calc = createDefaultCalculation(parsed.data.name);
  const stored = await writeCalculation(calc);
  return NextResponse.json(stored, { status: 201 });
}
