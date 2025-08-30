import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEMO_ORG = 'demo-org';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const deal = await prisma.deal.findFirst({ where: { id: params.id, orgId: DEMO_ORG } });
  if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(deal);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const deal = await prisma.deal.update({
    where: { id: params.id },
    data: body
  });
  return NextResponse.json(deal);
}
