import { NextResponse } from 'next/server';

const TRIAL_ENDS_AT = '2025-09-10T00:00:00Z';
const INCLUDES = 'all-tools';
const VALID_ENTRY_POINTS = ['hero', 'nav', 'feature:AI Deal Analyzer'] as const;

type EntryPoint = typeof VALID_ENTRY_POINTS[number];

export async function POST(req: Request) {
  const body = await req.json();
  const entryPoint: unknown = body?.entryPoint;

  if (!VALID_ENTRY_POINTS.includes(entryPoint as EntryPoint)) {
    return NextResponse.json({ ok: false, error: 'Invalid entryPoint' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, trialEndsAt: TRIAL_ENDS_AT, includes: INCLUDES });
}

