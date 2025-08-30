import { PrismaClient } from '@prisma/client';
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}
export const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export async function getDemoOrgId() {
  // simple org bootstrap since auth isn’t wired yet
  const existing = await prisma.org.findFirst({ where: { name: 'Demo Org' }});
  if (existing) return existing.id;
  const created = await prisma.org.create({ data: { name: 'Demo Org' }});
  return created.id;
}
