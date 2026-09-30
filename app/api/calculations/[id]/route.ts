import { NextResponse } from 'next/server';
import { CALCULATION_ID } from '@/lib/config';
import { getDictionary } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n/server';
import { calculationSchema } from '@/lib/schemas';
import { CalculationNotFoundError, readCalculation, writeCalculation } from '@/lib/storage';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

async function notFoundResponse() {
  const t = await getT();
  return NextResponse.json({ error: t.api.notFound }, { status: 404 });
}

async function getT() {
  return getDictionary(await getLocale());
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (id !== CALCULATION_ID) return await notFoundResponse();
  try {
    const calc = await readCalculation(id);
    return NextResponse.json(calc);
  } catch (err) {
    if (err instanceof CalculationNotFoundError) {
      return await notFoundResponse();
    }
    throw err;
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (id !== CALCULATION_ID) return await notFoundResponse();
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: (await getT()).api.invalidJson }, { status: 400 });
  }
  const parsed = calculationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: (await getT()).api.invalidData, issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  if (parsed.data.id !== id) {
    return NextResponse.json({ error: (await getT()).api.idMismatch }, { status: 400 });
  }
  const updated = { ...parsed.data, updatedAt: new Date().toISOString() };
  const stored = await writeCalculation(updated);
  return NextResponse.json(stored);
}
