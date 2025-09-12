'use client';
import React from 'react';

interface Props {
  label: string;
  value?: number | string;
  onExplain?: () => void;
}

export function ExplainableStat({ label, value, onExplain }: Props) {
  const display = typeof value === 'number' ? value.toLocaleString(undefined,{maximumFractionDigits:2}) : (value ?? '—');
  return (
    <div className="rounded-2xl border p-4 bg-white space-y-1">
      <div className="text-sm opacity-60">{label}</div>
      <div className="text-xl font-semibold">{display}</div>
      {onExplain && (
        <button type="button" className="text-xs text-indigo-600" onClick={onExplain}>
          Explain
        </button>
      )}
    </div>
  );
}
