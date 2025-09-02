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

const FinalOutputsPanel: React.FC<FinalOutputsProps> = ({ dealType, inputs, closing, hold }) => {
  const cashToClose =
    inputs.purchasePrice +
    inputs.rehab +
    closing.purchase -
    inputs.loanAmount -
    closing.financeable;

  const flipProfit =
    inputs.arv -
    (inputs.purchasePrice + inputs.rehab + closing.total + hold.total);

  const monthlyDebt = inputs.monthlyDebtService ?? 1200; // example default
  const dscr =
    inputs.monthlyRent > 0 && inputs.opexMonthly > 0
      ? (inputs.monthlyRent - inputs.opexMonthly) / monthlyDebt
      : 0;

  return (
    <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">Summary</h2>
      <p>Cash to Close: {currency(cashToClose)}</p>
      {dealType === "flip" && <p>Flip Profit: {currency(flipProfit)}</p>}
      {dealType !== "flip" && <p>DSCR: {dscr.toFixed(2)}</p>}
    </div>
  );
};

export default FinalOutputsPanel;
