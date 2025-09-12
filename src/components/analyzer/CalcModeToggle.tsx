"use client";
import * as React from "react";

export type CalcModeId = "Conservative" | "Lender" | "Broker" | "DealCheck" | "Custom";

interface Props {
  value: CalcModeId;
  onChange: (id: CalcModeId) => void;
  note?: string;
  className?: string;
}

export function CalcModeToggle({ value, onChange, note, className }: Props) {
  const options: CalcModeId[] = ["Conservative", "Lender", "Broker", "DealCheck", "Custom"];
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">Calculation Mode</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as CalcModeId)}
        className="w-full rounded-lg border px-3 py-2"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      {note ? <p className="mt-1 text-xs text-gray-500">{note}</p> : null}
    </div>
  );
}
