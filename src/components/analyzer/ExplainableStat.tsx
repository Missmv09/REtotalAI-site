"use client";
import * as React from "react";

interface Props {
  label: string;
  value: React.ReactNode;
  sub?: string;
  onExplain?: () => void;
  className?: string;
}

export function ExplainableStat({ label, value, sub, onExplain, className }: Props) {
  return (
    <div className={`rounded-xl border p-3 ${className ?? ""}`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
      <div className="flex items-center justify-between mt-1">
        <div className="text-xs text-gray-500">{sub}</div>
        {onExplain ? (
          <button type="button" className="text-xs underline" onClick={onExplain}>Explain</button>
        ) : null}
      </div>
    </div>
  );
}
