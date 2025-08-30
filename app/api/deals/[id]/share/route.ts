import { NextResponse } from 'next/server';
import { prisma, getDemoOrgId } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const orgId = await getDemoOrgId();
  // reuse existing non-expired link if present
  const existing = await prisma.sharedLink.findFirst({
    where: { orgId, dealId: params.id, expiresAt: null },
    select: { token: true }
  });
  const token = existing?.token ?? randomBytes(16).toString('hex');
  if (!existing) {
    await prisma.sharedLink.create({ data: { orgId, dealId: params.id, token } });
  }
  return NextResponse.json({ url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/share/${token}`, token });
}
