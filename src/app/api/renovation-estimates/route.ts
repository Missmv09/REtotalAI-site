import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';

const defaults = {
  taxPct: 0.0875,
  contingencyPct: 0.1,
  laborMultipliers: {
    'paint-interior': 0.75,
    'flooring-lvp': 1.25,
    'flooring-carpet': 0.95,
    'tile-floor': 3.0,
    countertop: 25.0,
    roof: 2.5,
    windows: 120.0,
    baseboards: 1.5,
  } as Record<string, number>,
  waste: {
    flooring: 0.1,
    tile: 0.12,
    paint: 0.1,
  },
};

type Scope =
  | 'paint-interior'
  | 'flooring-lvp'
  | 'flooring-carpet'
  | 'tile-floor'
  | 'countertop'
  | 'roof'
  | 'windows'
  | 'baseboards';

type Room = {
  name: string;
  length_ft: number;
  width_ft: number;
  ceiling_ft: number;
  doors?: number;
  windows?: number;
};

function roomAreaSqft(room: Room) {
  return room.length_ft * room.width_ft;
}

function wallAreaSqft(room: Room) {
  const perimeter = 2 * (room.length_ft + room.width_ft);
  const gross = perimeter * room.ceiling_ft;
  const openings = (room.doors || 0) * 20 + (room.windows || 0) * 15;
  return Math.max(gross - openings, 0);
}

function gallonsForPaint(wallSqft: number, coveragePerGallon = 350) {
  const waste = defaults.waste.paint ?? 0;
  return Math.ceil((wallSqft / coveragePerGallon) * (1 + waste));
}

function sqftWithWaste(area: number, waste = 0.1) {
  return Math.ceil(area * (1 + waste));
}

type Body = {
  propertyId?: string;
  mode: 'quick' | 'detailed';
  totalSqft?: number;
  rooms?: Room[];
  scopes: Scope[];
  taxPct?: number;
  contingencyPct?: number;
  laborOverrides?: Record<Scope, number>;
  skuMap?: Partial<Record<Scope, { sku: string }>>;
};

type LaborOverrides = Body['laborOverrides'];
type SkuMap = Body['skuMap'];

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body;

  const {
    propertyId = 'temp',
    mode,
    totalSqft = 0,
    rooms = [],
    scopes = [],
    taxPct = defaults.taxPct,
    contingencyPct = defaults.contingencyPct,
    laborOverrides = {},
    skuMap = {},
  } = body;

  const lineItems: any[] = [];
  const laborTotals: number[] = [];

  async function pickItem(category: string, preferred?: { sku: string }) {
    if (preferred?.sku) {
      const got = await prisma.catalogItem.findFirst({
        where: { sku: preferred.sku },
      });
      if (got) return got;
    }
    return prisma.catalogItem.findFirst({
      where: { category },
      orderBy: { updatedAt: 'desc' },
    });
  }

  function addLine(
    name: string,
    qty: number,
    unit: string,
    unitPrice: number,
    sku?: string,
    meta: any = {}
  ) {
    const total = +(qty * unitPrice).toFixed(2);
    lineItems.push({
      type: 'material',
      name,
      qty,
      unit,
      unitPrice,
      total,
      sku,
      ...meta,
    });
    return total;
  }

  function addLabor(scope: Scope, qty: number, rate: number, unit: string) {
    const total = +(qty * rate).toFixed(2);
    lineItems.push({
      type: 'labor',
      name: `${scope} labor`,
      qty,
      unit,
      unitPrice: rate,
      total,
    });
    laborTotals.push(total);
    return total;
  }

  let materialTotal = 0;

  const totalAreaQuick =
    mode === 'quick'
      ? totalSqft
      : (rooms as Room[]).reduce((sum, room) => sum + roomAreaSqft(room), 0);

  const totalWallQuick =
    mode === 'quick'
      ? totalAreaQuick * 3
      : (rooms as Room[]).reduce((sum, room) => sum + wallAreaSqft(room), 0);

  for (const scope of scopes as Scope[]) {
    const laborRate =
      (laborOverrides as LaborOverrides)[scope] ??
      defaults.laborMultipliers[scope] ??
      0;

    if (scope === 'paint-interior') {
      const wallArea = totalWallQuick;
      const gallons = gallonsForPaint(wallArea);
      const paint = await pickItem('paint-interior', (skuMap as SkuMap)[scope]);
      if (paint) {
        materialTotal += addLine(
          paint.name,
          gallons,
          'gallon',
          Number(paint.unitPrice),
          paint.sku,
          { category: paint.category }
        );
      }
      addLabor(scope, wallArea, laborRate, 'sqft');
    }

    if (
      scope === 'flooring-lvp' ||
      scope === 'flooring-carpet' ||
      scope === 'tile-floor'
    ) {
      const area = totalAreaQuick;
      const waste =
        scope === 'tile-floor'
          ? defaults.waste.tile!
          : defaults.waste.flooring!;
      const sqft = sqftWithWaste(area, waste);
      const mat = await pickItem(scope, (skuMap as SkuMap)[scope]);
      if (mat) {
        materialTotal += addLine(
          mat.name,
          sqft,
          'sqft',
          Number(mat.unitPrice),
          mat.sku,
          { category: mat.category }
        );
      }
      addLabor(scope, sqft, laborRate, 'sqft');
    }

    if (scope === 'countertop') {
      const sqft =
        mode === 'quick'
          ? 20
          : Math.max(20, (rooms as Room[]).length * 5);
      const slab = await pickItem('countertop', (skuMap as SkuMap)[scope]);
      if (slab) {
        materialTotal += addLine(
          slab.name,
          sqft,
          'sqft',
          Number(slab.unitPrice),
          slab.sku,
          { category: slab.category }
        );
      }
      addLabor(scope, sqft, laborRate, 'sqft');
    }

    if (scope === 'roof') {
      const squares = Math.ceil((totalAreaQuick * 1.2) / 100);
      const shingle = await pickItem('roof-shingle', (skuMap as SkuMap)[scope]);
      if (shingle) {
        materialTotal += addLine(
          shingle.name,
          squares,
          'square',
          Number(shingle.unitPrice),
          shingle.sku,
          { category: shingle.category }
        );
      }
      addLabor(scope, squares * 100, laborRate, 'sqft');
    }

    if (scope === 'windows') {
      const count = Math.max(1, Math.round(totalAreaQuick / 150));
      const windowItem = await pickItem(
        'window-vinyl',
        (skuMap as SkuMap)[scope]
      );
      if (windowItem) {
        materialTotal += addLine(
          windowItem.name,
          count,
          'each',
          Number(windowItem.unitPrice),
          windowItem.sku,
          { category: windowItem.category }
        );
      }
      addLabor(scope, count, laborRate, 'each');
    }

    if (scope === 'baseboards') {
      const linear =
        mode === 'quick'
          ? Math.round(Math.sqrt(totalAreaQuick) * 4)
          : (rooms as Room[]).reduce(
              (sum, room) => sum + 2 * (room.length_ft + room.width_ft),
              0
            );
      const base = await pickItem('baseboard-mdf', (skuMap as SkuMap)[scope]);
      if (base) {
        materialTotal += addLine(
          base.name,
          linear,
          'linear_ft',
          Number(base.unitPrice),
          base.sku,
          { category: base.category }
        );
      }
      addLabor(scope, linear, laborRate, 'linear_ft');
    }
  }

  const laborTotal = laborTotals.reduce((a, b) => a + b, 0);
  const subtotal = +(materialTotal + laborTotal).toFixed(2);
  const contingency = +(subtotal * contingencyPct).toFixed(2);
  const tax = +(materialTotal * taxPct).toFixed(2);
  const grandTotal = +(subtotal + contingency + tax).toFixed(2);

  const estimate = await prisma.renovationEstimate.create({
    data: {
      propertyId,
      name: 'Auto Estimate',
      inputs: body,
      lineItems,
      subtotal,
      contingencyPct,
      contingency,
      taxPct,
      tax,
      laborTotal,
      grandTotal,
    },
  });

  return NextResponse.json({
    estimateId: estimate.id,
    materialTotal,
    laborTotal,
    subtotal,
    contingency,
    tax,
    grandTotal,
    lineItems,
  });
}

