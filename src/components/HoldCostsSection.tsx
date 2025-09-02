import { useEffect, useState } from "react";
import type { ChangeEvent, FC } from "react";

export interface HoldTotals {
  monthly: number;
  oneTime: number;
  monthsHeld: number;
  total: number;
}

interface HoldCostsProps {
  kind: "carry" | "opex";
  bases: Record<string, any>;
  onChange?: (state: HoldTotals, totals: HoldTotals) => void;
  className?: string;
}

const HoldCostsSection: FC<HoldCostsProps> = ({ kind, bases, onChange, className }) => {
  const [monthly, setMonthly] = useState(0);
  const [oneTime, setOneTime] = useState(0);
  const [monthsHeld, setMonthsHeld] = useState(6);

  useEffect(() => {
    const totals: HoldTotals = {
      monthly,
      oneTime,
      monthsHeld: kind === "carry" ? monthsHeld : 0,
      total: kind === "carry" ? monthly * monthsHeld + oneTime : monthly,
    };
    onChange?.(totals, totals);
  }, [monthly, oneTime, monthsHeld, kind, onChange]);

  return (
    <div className={`space-y-4 rounded-2xl bg-white p-4 shadow-sm ${className ?? ""}`}>
      <h2 className="text-lg font-semibold text-slate-800">
        {kind === "carry" ? "Hold Costs" : "Operating Expenses"}
      </h2>
      {kind === "carry" ? (
        <>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Months Held</label>
            <input
              type="number"
              min={0}
              value={monthsHeld}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setMonthsHeld(Number(e.target.value) || 0)}
              className="w-24 rounded border border-slate-200 p-1"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Monthly Hold Cost</label>
            <input
              type="number"
              min={0}
              value={monthly}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setMonthly(Number(e.target.value) || 0)}
              className="w-32 rounded border border-slate-200 p-1"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">One-Time Costs</label>
            <input
              type="number"
              min={0}
              value={oneTime}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setOneTime(Number(e.target.value) || 0)}
              className="w-32 rounded border border-slate-200 p-1"
            />
          </div>
          <div className="text-sm text-slate-600">
            Total Hold Costs: {(monthly * monthsHeld + oneTime).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Monthly Operating Expenses</label>
            <input
              type="number"
              min={0}
              value={monthly}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setMonthly(Number(e.target.value) || 0)}
              className="w-32 rounded border border-slate-200 p-1"
            />
          </div>
          <div className="text-sm text-slate-600">
            Total Monthly Expenses: {monthly.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
          </div>
        </>
      )}
    </div>
  );
};

export default HoldCostsSection;

