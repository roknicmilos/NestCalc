import { NextResponse } from 'next/server';
import { CALCULATION_ID } from '@/lib/config';
import { calculationSchema } from '@/lib/schemas';
import { CalculationNotFoundError, readCalculation, writeCalculation } from '@/lib/storage';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

function notFoundResponse() {
  return NextResponse.json({ error: 'Kalkulacija nije pronađena.' }, { status: 404 });
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (id !== CALCULATION_ID) return notFoundResponse();
  try {
    const calc = await readCalculation(id);
    return NextResponse.json(calc);
  } catch (err) {
    if (err instanceof CalculationNotFoundError) {
      return NextResponse.json({ error: 'Kalkulacija nije pronađena.' }, { status: 404 });
    }
    throw err;
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (id !== CALCULATION_ID) return notFoundResponse();
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Telo zahteva mora biti JSON.' }, { status: 400 });
  }
  const parsed = calculationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Neispravni podaci kalkulacije.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  if (parsed.data.id !== id) {
    return NextResponse.json(
      { error: 'ID u URL-u i telu zahteva se ne poklapaju.' },
      { status: 400 },
    );
  }
  const updated = { ...parsed.data, updatedAt: new Date().toISOString() };
  const stored = await writeCalculation(updated);
  return NextResponse.json(stored);
}
