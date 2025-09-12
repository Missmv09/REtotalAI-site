"use client";
import React from 'react';
import type { CalcBases } from '@/lib/calc/types';

export function CalcBasesAdvanced({ value, onChange }: { value: CalcBases; onChange: (b: CalcBases) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      <label className="flex flex-col">
        Loan Basis
        <input className="mt-1 rounded border px-2 py-1" value={value.loanBasis} onChange={e=>onChange({...value, loanBasis:e.target.value})} />
      </label>
      <label className="flex flex-col">
        % Basis
        <input className="mt-1 rounded border px-2 py-1" value={value.percentBasis} onChange={e=>onChange({...value, percentBasis:e.target.value})} />
      </label>
      <label className="flex flex-col">
        Cap/GRM Basis
        <input className="mt-1 rounded border px-2 py-1" value={value.capBasis} onChange={e=>onChange({...value, capBasis:e.target.value})} />
      </label>
      <label className="flex flex-col">
        Invested Basis
        <input className="mt-1 rounded border px-2 py-1" value={value.investedBasis} onChange={e=>onChange({...value, investedBasis:e.target.value})} />
      </label>
    </div>
  );
}
