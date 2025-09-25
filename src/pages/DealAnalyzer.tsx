// src/pages/DealAnalyzer.tsx
import React, { useState } from "react";
import ClosingCostsSection, {
  ClosingCostItem,
  Totals as ClosingTotals,
} from "../components/ClosingCostsSection";
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
  const [closingItems, setClosingItems] = useState<ClosingCostItem[]>([]);
  const [closingTotals, setClosingTotals] = useState<ClosingTotals>({
    purchase: 0,
    exit: 0,
    total: 0,
    financeable: 0,
  });
  const [holdTotals, setHoldTotals] = useState<HoldTotals>({ monthly: 0, oneTime: 0, monthsHeld: 0, total: 0 });
  const [monthlyOpex, setMonthlyOpex] = useState(0);

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Deal Analyzer</h1>

      {/* Closing Costs */}
      <ClosingCostsSection
        exitKind="sale"
        bases={{
          loan_amount: loanAmount,
          purchase_price: purchasePrice,
          sale_price: arv,
          refi_loan: loanAmount,
        }}
        value={closingItems}
        onChange={(items, total) => {
          setClosingItems(items);
          setClosingTotals({ purchase: total, exit: 0, total, financeable: 0 });
        }}
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

      {/* Final Outputs / Summary */}
      <FinalOutputsPanel
        dealType={"flip" /* or "rental" / "brrrr" based on mode */}
        inputs={{
          purchasePrice,
          rehab,
          arv, // or salePrice
          loanAmount,
          annualRate: 0.12, // example; wire from Financing section if you have it
          termYears: 30, // example; wire from Financing
          interestOnly: false, // example; wire from Financing
          monthlyRent,
          opexMonthly: monthlyOpex, // from HoldCosts opex
          // monthlyDebtService: myMonthlyPAndI, // if you already compute this elsewhere, pass it to override
          rehabFinanced: false,
        }}
        closing={closingTotals} // from ClosingCostsSection onChange
        hold={{ total: holdTotals.total, monthly: holdTotals.monthly }} // from HoldCostsSection (carry)
      />
    </div>
  );
}
