import { NextResponse } from 'next/server';
import { getDictionary } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n/server';
import { calculationSchema } from '@/lib/schemas';
import { CalculationNotFoundError, readCalculation, writeCalculation } from '@/lib/storage';

export const dynamic = 'force-dynamic';

async function notFoundResponse() {
  const t = await getT();
  return NextResponse.json({ error: t.api.notFound }, { status: 404 });
}

async function getT() {
  return getDictionary(await getLocale());
}

export async function GET() {
  try {
    const calc = await readCalculation();
    return NextResponse.json(calc);
  } catch (err) {
    if (err instanceof CalculationNotFoundError) {
      return await notFoundResponse();
    }
    throw err;
  }
}

export async function PUT(request: Request) {
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
  const updated = { ...parsed.data, updatedAt: new Date().toISOString() };
  const stored = await writeCalculation(updated);
  return NextResponse.json(stored);
}
