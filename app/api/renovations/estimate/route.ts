import { NextRequest, NextResponse } from 'next/server'
import {
  defaults,
  roomAreaSqft,
  wallAreaSqft,
  gallonsForPaint,
  sqftWithWaste,
  Scope,
  Room,
} from '@/lib/costing'
import { prisma } from '@/lib/db'

type RequestBody = {
  propertyId?: string
  mode: 'quick' | 'detailed'
  totalSqft?: number
  rooms?: Room[]
  scopes: Scope[]
  taxPct?: number
  contingencyPct?: number
  laborOverrides?: Partial<Record<Scope, number>>
  skuMap?: Partial<Record<Scope, { sku: string }>>
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as RequestBody

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
  } = body

  const lineItems: any[] = []
  const laborTotals: number[] = []

  async function pickItem(category: string, preferred?: { sku: string }) {
    if (preferred?.sku) {
      const got = await prisma.catalogItem.findFirst({
        where: { sku: preferred.sku },
      })
      if (got) return got
    }
    return prisma.catalogItem.findFirst({
      where: { category },
      orderBy: { updatedAt: 'desc' },
    })
  }

  function addMaterial(
    name: string,
    qty: number,
    unit: string,
    unitPrice: number,
    sku?: string,
    meta: any = {}
  ) {
    const total = +(qty * unitPrice).toFixed(2)
    lineItems.push({
      type: 'material',
      name,
      qty,
      unit,
      unitPrice,
      total,
      sku,
      ...meta,
    })
    return total
  }

  function addLabor(scope: Scope, qty: number, rate: number, unit: string) {
    const total = +(qty * rate).toFixed(2)
    lineItems.push({
      type: 'labor',
      name: `${scope} labor`,
      qty,
      unit,
      unitPrice: rate,
      total,
    })
    laborTotals.push(total)
    return total
  }

  let materialTotal = 0

  const totalAreaQuick =
    mode === 'quick'
      ? totalSqft
      : rooms.reduce((sum, r) => sum + roomAreaSqft(r), 0)

  const totalWallQuick =
    mode === 'quick'
      ? totalAreaQuick * 3
      : rooms.reduce((sum, r) => sum + wallAreaSqft(r), 0)

  for (const scope of scopes) {
    const laborRate =
      laborOverrides[scope] ?? defaults.laborMultipliers[scope] ?? 0

    if (scope === 'paint-interior') {
      const wallArea = totalWallQuick
      const gallons = gallonsForPaint(wallArea)
      const paint = await pickItem('paint-interior', skuMap[scope])
      if (paint) {
        materialTotal += addMaterial(
          paint.name,
          gallons,
          'gallon',
          Number(paint.unitPrice),
          paint.sku,
          { category: paint.category }
        )
      }
      addLabor(scope, wallArea, laborRate, 'sqft')
    }

    if (
      scope === 'flooring-lvp' ||
      scope === 'flooring-carpet' ||
      scope === 'tile-floor'
    ) {
      const waste =
        scope === 'tile-floor'
          ? defaults.waste.tile ?? 0.12
          : defaults.waste.flooring ?? 0.1
      const sqft = sqftWithWaste(totalAreaQuick, waste)
      const mat = await pickItem(scope, skuMap[scope])
      if (mat) {
        materialTotal += addMaterial(
          mat.name,
          sqft,
          'sqft',
          Number(mat.unitPrice),
          mat.sku,
          { category: mat.category }
        )
      }
      addLabor(scope, sqft, laborRate, 'sqft')
    }

    if (scope === 'countertop') {
      const sqft =
        mode === 'quick' ? 20 : Math.max(20, rooms.length * 5)
      const slab = await pickItem('countertop', skuMap[scope])
      if (slab) {
        materialTotal += addMaterial(
          slab.name,
          sqft,
          'sqft',
          Number(slab.unitPrice),
          slab.sku,
          { category: slab.category }
        )
      }
      addLabor(scope, sqft, laborRate, 'sqft')
    }

    if (scope === 'roof') {
      const squares = Math.ceil((totalAreaQuick * 1.2) / 100)
      const shingle = await pickItem('roof-shingle', skuMap[scope])
      if (shingle) {
        materialTotal += addMaterial(
          shingle.name,
          squares,
          'square',
          Number(shingle.unitPrice),
          shingle.sku,
          { category: shingle.category }
        )
      }
      addLabor(scope, squares * 100, laborRate, 'sqft')
    }

    if (scope === 'windows') {
      const count = Math.max(1, Math.round(totalAreaQuick / 150))
      const win = await pickItem('window-vinyl', skuMap[scope])
      if (win) {
        materialTotal += addMaterial(
          win.name,
          count,
          'each',
          Number(win.unitPrice),
          win.sku,
          { category: win.category }
        )
      }
      addLabor(scope, count, laborRate, 'each')
    }

    if (scope === 'baseboards') {
      const linear =
        mode === 'quick'
          ? Math.round(Math.sqrt(totalAreaQuick) * 4)
          : rooms.reduce(
              (s, r) => s + 2 * (r.length_ft + r.width_ft),
              0
            )
      const base = await pickItem('baseboard-mdf', skuMap[scope])
      if (base) {
        materialTotal += addMaterial(
          base.name,
          linear,
          'linear_ft',
          Number(base.unitPrice),
          base.sku,
          { category: base.category }
        )
      }
      addLabor(scope, linear, laborRate, 'linear_ft')
    }
  }

  const laborTotal = laborTotals.reduce((a, b) => a + b, 0)
  const subtotal = +(materialTotal + laborTotal).toFixed(2)
  const contingency = +(subtotal * contingencyPct).toFixed(2)
  const tax = +(materialTotal * taxPct).toFixed(2)
  const grandTotal = +(subtotal + contingency + tax).toFixed(2)

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
  })

  return NextResponse.json({
    estimateId: estimate.id,
    materialTotal,
    laborTotal,
    subtotal,
    contingency,
    tax,
    grandTotal,
    lineItems,
  })
}
