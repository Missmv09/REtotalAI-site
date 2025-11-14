export type Scope =
  | 'paint-interior'
  | 'flooring-lvp'
  | 'flooring-carpet'
  | 'tile-floor'
  | 'tile-backsplash'
  | 'countertop'
  | 'roof'
  | 'windows'
  | 'baseboards'
  | 'drywall-repair'
  | 'hvac'
  | 'plumbing-fixtures'
  | 'electrical-fixtures'

export type Room = {
  name: string
  length_ft: number
  width_ft: number
  ceiling_ft: number
  doors?: number
  windows?: number
}

export type CostContext = {
  taxPct: number
  contingencyPct: number
  laborMultipliers: Partial<Record<Scope, number>>
  waste: Partial<Record<'flooring' | 'tile' | 'paint', number>>
}

export const defaults: CostContext = {
  taxPct: 0.0875,
  contingencyPct: 0.1,
  laborMultipliers: {
    'paint-interior': 0.75,
    'flooring-lvp': 1.25,
    'flooring-carpet': 0.95,
    'tile-floor': 3.0,
    'tile-backsplash': 8.0,
    countertop: 25.0,
    roof: 2.5,
    windows: 120.0,
    baseboards: 1.5,
    'drywall-repair': 2.0,
    hvac: 800.0,
    'plumbing-fixtures': 150.0,
    'electrical-fixtures': 120.0,
  },
  waste: { flooring: 0.1, tile: 0.12, paint: 0.1 },
}

export function roomAreaSqft(r: Room) {
  return r.length_ft * r.width_ft
}

export function wallAreaSqft(r: Room) {
  const perimeter = 2 * (r.length_ft + r.width_ft)
  const gross = perimeter * r.ceiling_ft
  const openings = (r.doors || 0) * 20 + (r.windows || 0) * 15
  return Math.max(gross - openings, 0)
}

export function gallonsForPaint(
  wallSqft: number,
  coveragePerGallon = 350,
  waste = defaults.waste.paint ?? 0.1
) {
  return Math.ceil((wallSqft / coveragePerGallon) * (1 + waste))
}

export function sqftWithWaste(area: number, waste = 0.1) {
  return Math.ceil(area * (1 + waste))
}
