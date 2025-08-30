import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_: Request, { params }: { params: { token: string } }) {
  const link = await prisma.sharedLink.findUnique({ where: { token: params.token } });
  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // latest run snapshot if exists
  const run = await prisma.analysisRun.findFirst({
    where: { dealId: link.dealId },
    orderBy: { createdAt: 'desc' }
  });

  const deal = await prisma.deal.findUnique({ where: { id: link.dealId } });
  return NextResponse.json({ deal, outputs: run?.outputs ?? null, createdAt: run?.createdAt ?? null });
}
