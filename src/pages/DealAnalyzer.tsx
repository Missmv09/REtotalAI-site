import React, { useState } from "react";
import ClosingCostsSection, { Totals as ClosingTotals } from "./ClosingCostsSection";
import HoldCostsSection, { HoldTotals } from "./HoldCostsSection";

export default function DealAnalyzer() {
  // ------------------------
  // State for bases
  // ------------------------
  const [purchasePrice, setPurchasePrice] = useState(200000);
  const [rehab, setRehab] = useState(50000);
  const [arv, setArv] = useState(320000);
  const [loanAmount, setLoanAmount] = useState(150000);
  const [monthlyRent, setMonthlyRent] = useState(2500);

  // ------------------------
  // State for modules
  // ------------------------
  const [closingTotals, setClosingTotals] = useState<ClosingTotals>({ purchase: 0, exit: 0, total: 0, financeable: 0 });
  const [holdTotals, setHoldTotals] = useState<HoldTotals>({ monthly: 0, oneTime: 0, monthsHeld: 0, total: 0 });
  const [monthlyOpex, setMonthlyOpex] = useState(0);

  // ------------------------
  // Example Outputs
  // ------------------------
  const cashToClose = purchasePrice + rehab + closingTotals.purchase - loanAmount - closingTotals.financeable;
  const flipProfit = arv - (purchasePrice + rehab + closingTotals.total + holdTotals.total); // simplified
  const dscr = monthlyRent > 0 && monthlyOpex > 0 ? (monthlyRent - monthlyOpex) / 1200 : 0; // 1200 = example P&I

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Deal Analyzer</h1>

      {/* Closing Costs */}
      <ClosingCostsSection
        bases={{ purchasePrice, loanAmount, salePrice: arv, refiLoan: loanAmount }}
        onChange={(_, totals) => setClosingTotals(totals)}
      />

      {/* Hold Costs for Flip */}
      <HoldCostsSection
        kind="carry"
        bases={{}}
        onChange={(_, totals) => setHoldTotals(totals)}
      />

      {/* Operating Expenses for Rental */}
      <HoldCostsSection
        kind="opex"
        bases={{ monthlyRent }}
        onChange={(_, totals) => setMonthlyOpex(totals.total)}
      />

      {/* Outputs */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Summary</h2>
        <p>Cash to Close: ${cashToClose.toLocaleString()}</p>
        <p>Flip Profit: ${flipProfit.toLocaleString()}</p>
        <p>DSCR (Rental): {dscr.toFixed(2)}</p>
      </div>
    </div>
  );
}

