import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEMO_ORG = 'demo-org';
const DEMO_USER = 'demo-user';

export async function POST(req: Request) {
  const body = await req.json();
  const deal = await prisma.deal.create({
    data: {
      orgId: DEMO_ORG,
      name: body.name ?? 'Untitled Deal',
      purchasePrice: body.purchasePrice ?? 0,
      rehabCost: body.rehabCost ?? 0,
      arv: body.arv ?? 0,
      holdingMonths: body.holdingMonths ?? 6,
    }
  });
  return NextResponse.json(deal);
}

export async function GET() {
  const deals = await prisma.deal.findMany({ where: { orgId: DEMO_ORG } });
  return NextResponse.json(deals);
}
