import { NextResponse } from 'next/server';
import { prisma, getDemoOrgId } from '@/lib/db';
import { analyze } from '@/lib/deal/analyze';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const inputs = await req.json();
  const outputs = analyze(inputs);
  const orgId = await getDemoOrgId();

  // save snapshot of the run
  await prisma.analysisRun.create({
    data: {
      orgId,
      dealId: params.id,
      inputs,
      outputs,
      version: 'v1',
    },
  });

  // bump usage ledger (simple: per-org, per month)
  const start = new Date();
  start.setDate(1); start.setHours(0,0,0,0);
  await prisma.usageLedger.upsert({
    where: { orgId_tool_periodStartDate: { orgId, tool: 'deal_analyzer', periodStartDate: start } },
    update: { count: { increment: 1 }, lastUsedAt: new Date() },
    create: { orgId, tool: 'deal_analyzer', periodStartDate: start, count: 1, lastUsedAt: new Date() },
  });

  return NextResponse.json(outputs);
}
