import { useState } from "react";

import ClosingCostsSection, { Totals as ClosingTotals } from "../components/ClosingCostsSection";
import HoldCostsSection, { HoldTotals } from "../components/HoldCostsSection";
import FinalOutputsPanel from "../components/FinalOutputsPanel";

export default function DealAnalyzer() {
  const [purchasePrice, setPurchasePrice] = useState(200000);
  const [rehab, setRehab] = useState(50000);
  const [arv, setArv] = useState(320000);
  const [loanAmount, setLoanAmount] = useState(150000);
  const [monthlyRent, setMonthlyRent] = useState(2500);

  const [closingTotals, setClosingTotals] = useState<ClosingTotals>({ purchase: 0, exit: 0, total: 0, financeable: 0 });
  const [holdTotals, setHoldTotals] = useState<HoldTotals>({ monthly: 0, oneTime: 0, monthsHeld: 0, total: 0 });
  const [monthlyOpex, setMonthlyOpex] = useState(0);

  const cashToClose = purchasePrice + rehab + closingTotals.purchase - loanAmount - closingTotals.financeable;
  const flipProfit   = arv - (purchasePrice + rehab + closingTotals.total + holdTotals.total);
  const dscr         = monthlyRent > 0 ? (monthlyRent - monthlyOpex) / 1200 : 0; // example P&I = 1200 unless you pass override

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Deal Analyzer</h1>

        <ClosingCostsSection
          bases={{ purchasePrice, loanAmount, salePrice: arv, refiLoan: loanAmount }}
          onChange={(_: unknown, totals: ClosingTotals) => setClosingTotals(totals)}
        />

        <HoldCostsSection kind="carry" bases={{}} onChange={(_: HoldTotals, t: HoldTotals) => setHoldTotals(t)} />

        <HoldCostsSection kind="opex" bases={{ monthlyRent }} onChange={(_: HoldTotals, t: HoldTotals) => setMonthlyOpex(t.total)} />

      <FinalOutputsPanel
        dealType={"flip" /* or "rental" / "brrrr" */}
        inputs={{
          purchasePrice, rehab, arv, loanAmount,
          annualRate: 0.12, termYears: 30, interestOnly: false,
          monthlyRent, opexMonthly: monthlyOpex,
          // monthlyDebtService: myMonthlyPAndI, // pass when you wire Financing
          rehabFinanced: false,
        }}
        closing={closingTotals}
        hold={{ total: holdTotals.total, monthly: holdTotals.monthly }}
      />
    </div>
  );
}
