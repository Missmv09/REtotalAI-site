import { expect, test } from 'vitest';
import { flipKPIs } from '@/lib/calc/formulas';

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
