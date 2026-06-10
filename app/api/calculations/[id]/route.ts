import { NextResponse } from 'next/server';
import { calculationSchema } from '@/lib/schemas';
import {
  CalculationNotFoundError,
  deleteCalculation,
  readCalculation,
  writeCalculation,
} from '@/lib/storage';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
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

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    await deleteCalculation(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof CalculationNotFoundError) {
      return NextResponse.json({ error: 'Kalkulacija nije pronađena.' }, { status: 404 });
    }
    throw err;
  }
}
