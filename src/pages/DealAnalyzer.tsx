import React, { useState } from "react";

// ✅ Correct imports (pointing to components folder)
import ClosingCostsSection, { Totals as ClosingTotals } from "../components/ClosingCostsSection";
import HoldCostsSection, { HoldTotals } from "../components/HoldCostsSection";
import FinalOutputsPanel from "../components/FinalOutputsPanel";

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
  const [closingTotals, setClosingTotals] = useState<ClosingTotals>({
    purchase: 0,
    exit: 0,
    total: 0,
    financeable: 0,
  });
  const [holdTotals, setHoldTotals] = useState<HoldTotals>({
    monthly: 0,
    oneTime: 0,
    monthsHeld: 0,
    total: 0,
  });
  const [monthlyOpex, setMonthlyOpex] = useState(0);

  // ------------------------
  // Example Outputs
  // ------------------------
  const cashToClose =
    purchasePrice +
    rehab +
    closingTotals.purchase -
    loanAmount -
    closingTotals.financeable;
  const flipProfit =
    arv - (purchasePrice + rehab + closingTotals.total + holdTotals.total); // simplified
  const dscr =
    monthlyRent > 0 && monthlyOpex > 0
      ? (monthlyRent - monthlyOpex) / 1200 // 1200 = example P&I
      : 0;

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

      {/* Final Outputs */}
      <FinalOutputsPanel
        dealType={"flip" /* or "rental" / "brrrr" based on mode */}
        inputs={{
          purchasePrice,
          rehab,
          arv,
          loanAmount,
          annualRate: 0.12, // example hard-coded
          termYears: 30,
          interestOnly: false,
          monthlyRent,
          opexMonthly: monthlyOpex,
          // monthlyDebtService: myMonthlyPAndI, // override if you compute it
          rehabFinanced: false,
        }}
        closing={closingTotals}
        hold={{ total: holdTotals.total, monthly: holdTotals.monthly }}
      />
    </div>
  );
}
