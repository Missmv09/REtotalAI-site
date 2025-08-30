import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyze, DealInputs } from '@/lib/deal/analyze';
import { z } from 'zod';

const DEMO_ORG = 'demo-org';
const DEMO_USER = 'demo-user';

const InputSchema = z.object({
  purchasePrice: z.number(),
  rehabCost: z.number(),
  arv: z.number(),
  loanAmount: z.number(),
  interestRate: z.number(),
  monthlyIncome: z.number(),
  holdingMonths: z.number()
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const json = await req.json();
  const inputs: DealInputs = InputSchema.parse(json);

  const org = await prisma.org.findUnique({ where: { id: DEMO_ORG } });
  const plan = org?.plan ?? 'starter';

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1); startOfMonth.setUTCHours(0,0,0,0);

  const usage = await prisma.usageLedger.findUnique({
    where: {
      orgId_userId_tool_month: {
        orgId: DEMO_ORG,
        userId: DEMO_USER,
        tool: 'deal_analyzer',
        month: startOfMonth
      }
    }
  });

  if (plan !== 'pro' && usage && usage.count >= 3) {
    return NextResponse.json({ error: 'Quota exceeded', upgrade: true }, { status: 402 });
  }

  const outputs = analyze(inputs);

  await prisma.analysisRun.create({
    data: {
      orgId: DEMO_ORG,
      dealId: params.id,
      userId: DEMO_USER,
      inputs,
      outputs
    }
  });

  await prisma.usageLedger.upsert({
    where: {
      orgId_userId_tool_month: {
        orgId: DEMO_ORG,
        userId: DEMO_USER,
        tool: 'deal_analyzer',
        month: startOfMonth
      }
    },
    update: { count: { increment: 1 } },
    create: {
      orgId: DEMO_ORG,
      userId: DEMO_USER,
      tool: 'deal_analyzer',
      month: startOfMonth,
      count: 1
    }
  });

  return NextResponse.json(outputs);
}
