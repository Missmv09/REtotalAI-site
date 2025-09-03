import { NextResponse } from 'next/server';

const TRIAL_DURATION_DAYS = 14;

export async function GET() {
  // In a real implementation, trial data would be fetched from a database or user session.
  const endsAt = new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  return NextResponse.json({ active: true, endsAt });
}
