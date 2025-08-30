import { NextResponse } from 'next/server';
import { prisma, getDemoOrgId } from '@/lib/db';

export async function GET() {
  const orgId = await getDemoOrgId();
  const deals = await prisma.deal.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, purchasePrice: true, rehabCost: true, arv: true, createdAt: true },
  });
  return NextResponse.json(deals);
}

export async function POST(req: Request) {
  const body = await req.json();
  const orgId = await getDemoOrgId();

  const deal = await prisma.deal.create({
    data: {
      orgId,
      title: body.title ?? 'Untitled Deal',
      purchasePrice: body.purchasePrice ?? 0,
      rehabCost: body.rehabCost ?? 0,
      arv: body.arv ?? null,
    },
  });

  // optional children
  if (body.loanTerms) {
    await prisma.loanTerms.create({ data: { dealId: deal.id, ...body.loanTerms } });
  }
  if (body.holdingCosts) {
    await prisma.holdingCosts.create({ data: { dealId: deal.id, ...body.holdingCosts } });
  }
  if (body.incomeAssumptions) {
    await prisma.incomeAssumptions.create({ data: { dealId: deal.id, ...body.incomeAssumptions } });
  }

  return NextResponse.json({ id: deal.id });
}
