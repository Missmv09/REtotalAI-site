import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEMO_ORG = 'demo-org';
const DEMO_USER = 'demo-user';

export async function POST(req: Request) {
  const body = await req.json();
  const deal = await prisma.deal.create({
    data: {
      orgId: DEMO_ORG,
      title: body.name ?? 'Untitled Deal',
      purchasePrice: body.purchasePrice ?? 0,
      rehabCost: body.rehabCost ?? 0,
      arv: body.arv ?? 0,
      monthsToComplete: body.monthsToComplete ?? 6,
      sellingCostPct: body.sellingCostPct ?? 8,
      loanType: body.loan?.type,
      loanPointsPct: body.loan?.pointsPct,
      loanLtvPct: body.loan?.ltvPct,
      loanInterestRate: body.loan?.interestRate,
      holdingMonthly: body.holdingMonthly ?? {},
    }
  });
  return NextResponse.json(deal);
}

export async function GET() {
  const deals = await prisma.deal.findMany({ where: { orgId: DEMO_ORG } });
  return NextResponse.json(deals);
}
