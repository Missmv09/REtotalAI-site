'use client';
import React, { useMemo } from 'react';
import { DealInput, CalcBases } from '@/lib/calc/types';
import { rentalKPIs, flipKPIs } from '@/lib/calc/formulas';

type Metric = 'annualCF' | 'profit';

interface Props {
  input: DealInput;
  bases: CalcBases;
  metric: Metric; // annualCF for hold, profit for flip
}

export function SensitivityTornado({ input, bases, metric }: Props) {
  const baseValue = useMemo(() => {
    return metric === 'profit'
      ? flipKPIs(input).profit
      : rentalKPIs(input, bases).annualCF;
  }, [input, bases, metric]);

  const shocks = useMemo(() => {
    const fields: (keyof DealInput)[] = ['rent', 'arv', 'rehab', 'ratePct'];
    return fields.map((f) => {
      const up: DealInput = { ...input, [f]: (input as any)[f] * 1.1 } as DealInput;
      const down: DealInput = { ...input, [f]: (input as any)[f] * 0.9 } as DealInput;
      const upVal = metric === 'profit' ? flipKPIs(up).profit : rentalKPIs(up, bases).annualCF;
      const downVal = metric === 'profit' ? flipKPIs(down).profit : rentalKPIs(down, bases).annualCF;
      const delta = Math.max(Math.abs(upVal - baseValue), Math.abs(downVal - baseValue));
      return { field: f, delta };
    }).sort((a,b)=>b.delta - a.delta);
  }, [input, bases, metric, baseValue]);

  return (
    <div className="space-y-1">
      {shocks.map((s) => (
        <div key={s.field} className="flex items-center gap-2 text-xs">
          <div className="w-24 capitalize">{s.field}</div>
          <div className="flex-1 bg-gray-200 h-2 relative">
            <div
              className="bg-indigo-500 h-2"
              style={{ width: `${Math.min(100, s.delta === 0 ? 0 : (s.delta / Math.max(...shocks.map(sh=>sh.delta))) * 100)}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}
