import React from "react";
import { Totals as ClosingTotals } from "./ClosingCostsSection";

export interface FinalOutputsProps {
  dealType: "flip" | "rental" | "brrrr";
  inputs: {
    purchasePrice: number;
    rehab: number;
    arv: number;
    loanAmount: number;
    annualRate: number;
    termYears: number;
    interestOnly: boolean;
    monthlyRent: number;
    opexMonthly: number;
    monthlyDebtService?: number;
    rehabFinanced: boolean;
  };
  closing: ClosingTotals;
  hold: { total: number; monthly: number };
}

const currency = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export default function FinalOutputsPanel({ dealType, inputs, closing, hold }: FinalOutputsProps) {
  const cashToClose =
    inputs.purchasePrice +
    inputs.rehab +
    closing.purchase -
    inputs.loanAmount -
    closing.financeable;
  const flipProfit =
    inputs.arv -
    (inputs.purchasePrice + inputs.rehab + closing.total + hold.total);
  const monthlyDebt = inputs.monthlyDebtService ?? 1200;
  const dscr =
    inputs.monthlyRent > 0 ? (inputs.monthlyRent - inputs.opexMonthly) / monthlyDebt : 0;

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-slate-800">Deal Summary</h2>
      <div className="grid grid-cols-2 gap-4">
        <Card label="Cash to Close" value={cashToClose} />
        {dealType === "flip" ? (
          <Card label="Flip Profit" value={flipProfit} />
        ) : (
          <Card label="DSCR" value={dscr.toFixed(2)} />
        )}
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: any }) {
  const v = typeof value === "number" ? currency(value) : String(value ?? "—");
  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm opacity-60">{label}</div>
      <div className="text-xl font-semibold">{v}</div>
    </div>
  );
}
