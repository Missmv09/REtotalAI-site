import { describe, expect, test } from 'vitest';
import { rentalKPIs } from '@/lib/calc/formulas';
import { CalcPresets } from '@/lib/calc/presets';

const conservative = CalcPresets.find(p => p.id === 'Conservative')!.bases;

test('Rental stronger case matches expected KPIs', () => {
  const d = {
    purchase: 180000, arv: 220000, rehab: 15000, rent: 1950,
    taxes: 3600, insurance: 1200, hoaMonthly: 0, otherMonthly: 50,
    vacancyPct: 5, managementPct: 8, maintenancePct: 5,
    downPct: 20, ratePct: 7.0, termYears: 30
  };
  const k = rentalKPIs(d as any, conservative);
  expect(Math.round(k.gar)).toBe(23400);
  expect(Math.round(k.opEx)).toBe(9612);
  expect(Math.round(k.noi)).toBe(13788);
  expect(Math.round(k.allIn)).toBe(195000);
  expect(k.capRate).toBeCloseTo(0.0707, 3);
  expect(Math.round(k.annualDebt)).toBeCloseTo(12454, -1);
  expect(k.dscr).toBeCloseTo(1.11, 2);
  expect(Math.round(k.annualCF)).toBeCloseTo(1334, -1);
  expect(k.oer).toBeCloseTo(0.4108, 3);
});

describe('DealCheck mode parity', () => {
  const bases = CalcPresets.find(p => p.id === 'DealCheck')!.bases;
  test('GRM and DSCR', () => {
    const d = {
      purchase: 250000, arv: 350000, rehab: 0, rent: 2200,
      taxes: 2400, insurance: 1200, hoaMonthly: 0, otherMonthly: 0,
      vacancyPct: 5, managementPct: 10, maintenancePct: 6,
      downPct: 20, ratePct: 7.0, termYears: 30
    };
    const k = rentalKPIs(d as any, bases);
    expect(k.grm).toBeCloseTo(9.47, 2);
    expect(k.dscr).toBeGreaterThanOrEqual(1.09);
    expect(k.dscr).toBeLessThanOrEqual(1.10);
  });
});
