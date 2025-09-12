'use client';
import React from 'react';
import { CalcBases } from '@/lib/calc/types';

interface Props {
  bases: CalcBases;
  onChange: (b: CalcBases) => void;
}

export function CalcBasesAdvanced({ bases, onChange }: Props) {
  const upd = (k: keyof CalcBases, v: any) => onChange({ ...bases, [k]: v });
  return (
    <div className="border rounded p-4 space-y-4">
      <div className="font-medium">Advanced math options</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <label className="space-y-1">
          <div>Loan basis</div>
          <select
            className="input"
            value={bases.loanBasis}
            onChange={(e) => upd('loanBasis', e.target.value)}
          >
            <option value="purchase">Purchase</option>
            <option value="all_in">All-in</option>
          </select>
        </label>
        <label className="space-y-1">
          <div>% expense basis</div>
          <select
            className="input"
            value={bases.percentBasis}
            onChange={(e) => upd('percentBasis', e.target.value)}
          >
            <option value="gross">Gross</option>
            <option value="egi">EGI</option>
          </select>
        </label>
        <label className="space-y-1">
          <div>Cap/GRM basis</div>
          <select
            className="input"
            value={bases.capBasis}
            onChange={(e) => upd('capBasis', e.target.value)}
          >
            <option value="purchase">Purchase</option>
            <option value="all_in">All-in</option>
          </select>
        </label>
        <label className="space-y-1">
          <div>CoC invested basis</div>
          <select
            className="input"
            value={bases.investedBasis}
            onChange={(e) => upd('investedBasis', e.target.value)}
          >
            <option value="down">Down</option>
            <option value="down_plus_rehab">Down + Rehab</option>
            <option value="down_plus_rehab_closing">Down + Rehab + Closing</option>
          </select>
        </label>
      </div>
    </div>
  );
}
