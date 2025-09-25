import { expect, test } from 'vitest';
import { flipKPIs } from '@/lib/calc/formulas';

const TOLERANCE = 1e-2;
const expectClose = (actual: number, expected: number) => {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOLERANCE);
};

test('Flip negative margin', () => {
  const d = { purchase:220000, arv:320000, rehab:60000, downPct:15, ratePct:8.5,
    holdingMonths:6, carryOtherMonthly:200, sellingCostPct:8, closingCostPct:2,
    rent:0, taxes:0, insurance:0, hoaMonthly:0, otherMonthly:0,
    vacancyPct:0, managementPct:0, maintenancePct:0, termYears:30 };
  const k = flipKPIs(d as any);
  expect(Math.round(k.totalCost)).toBe(323315);
  expect(Math.round(k.profit)).toBe(-3315);
  expect(k.margin).toBeCloseTo(-0.0104, 3);
  expect(k.equityMultiple).toBeCloseTo(0.968, 3);
});

test('Flip profitable', () => {
  const d = { purchase:220000, arv:360000, rehab:60000, downPct:15, ratePct:8.5,
    holdingMonths:6, carryOtherMonthly:200, sellingCostPct:8, closingCostPct:2,
    rent:0, taxes:0, insurance:0, hoaMonthly:0, otherMonthly:0,
    vacancyPct:0, managementPct:0, maintenancePct:0, termYears:30 };
  const k = flipKPIs(d as any);
  expect(Math.round(k.totalCost)).toBe(327315);
  expect(Math.round(k.profit)).toBe(32685);
  expect(k.margin).toBeCloseTo(0.0908, 3);
  expect(k.equityMultiple).toBeCloseTo(1.320, 3);
});

test('Flip Test Case B1 returns expected profitability', () => {
  const deal = {
    purchase: 269400,
    arv: 375444,
    rehab: 30000,
    downPct: 20,
    ratePct: 8.5,
    holdingMonths: 6,
    carryOtherMonthly: 200,
    sellingCostPct: 8,
    closingCostPct: 2,
    rent: 0,
    taxes: 0,
    insurance: 0,
    hoaMonthly: 0,
    otherMonthly: 0,
    vacancyPct: 0,
    managementPct: 0,
    maintenancePct: 0,
    termYears: 30
  };

  const k = flipKPIs(deal as any);
  const cashIn = k.down + deal.rehab;
  const roi = cashIn ? k.profit / cashIn : NaN;

  expectClose(k.profit, 27120);
  expectClose(cashIn, 89880);
  expectClose(roi, 0.3017);
});
