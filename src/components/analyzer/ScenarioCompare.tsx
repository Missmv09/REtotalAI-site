'use client';
import React from 'react';
import { DealInput, CalcBases } from '@/lib/calc/types';
import { rentalKPIs, flipKPIs } from '@/lib/calc/formulas';

interface Props {
  input: DealInput;
  bases: CalcBases;
}

export function ScenarioCompare({ input, bases }: Props) {
  const hold = rentalKPIs(input, bases);
  const brrrr = rentalKPIs(input, bases); // placeholder identical
  const flip = flipKPIs(input);
  return (
    <div className="grid md:grid-cols-3 gap-4 text-sm">
      <div className="border rounded p-3">
        <div className="font-medium mb-1">Hold</div>
        <div>Cap: {hold.capRate.toFixed(3)}</div>
        <div>DSCR: {hold.dscr.toFixed(2)}</div>
        <div>CF: {hold.annualCF.toFixed(0)}</div>
      </div>
      <div className="border rounded p-3">
        <div className="font-medium mb-1">BRRRR</div>
        <div>Cap: {brrrr.capRate.toFixed(3)}</div>
        <div>DSCR: {brrrr.dscr.toFixed(2)}</div>
        <div>CF: {brrrr.annualCF.toFixed(0)}</div>
      </div>
      <div className="border rounded p-3">
        <div className="font-medium mb-1">Flip</div>
        <div>Profit: {flip.profit.toFixed(0)}</div>
        <div>Margin: {(flip.margin * 100).toFixed(2)}%</div>
      </div>
    </div>
  );
}
