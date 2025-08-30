import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

const DEMO_ORG = 'demo-org';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const token = randomUUID();
  const link = await prisma.sharedLink.create({
    data: {
      orgId: DEMO_ORG,
      dealId: params.id,
      token
    }
  });
  return NextResponse.json({ url: `/share/${link.token}` });
}
