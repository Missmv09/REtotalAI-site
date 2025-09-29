export type LoanType = 'cash' | 'hard_money' | 'conventional' | 'dscr';

export type SellingBreakdown = {
  agentCommissionPct?: number;           // % of sale price (ARV)
  titleEscrow?: number;                  // $
  transferTaxesRecording?: number;       // $
  attorney?: number;                     // $
  marketing?: number;                    // $
  sellerMoving?: number;                 // $
  other?: number;                        // $
};

export type HoldingMonthly = {
  taxes?: number; insurance?: number; utilities?: number; hoa?: number; maintenance?: number;
};

export type DealInputs = {
  mode: 'flip' | 'buyhold' | 'brrrr';
  purchasePrice: number;
  rehabCost?: number;
  arv?: number;
  monthsToComplete?: number;             // "Holding Period (months)" for Flip/BRRRR rehab
  loan: {
    type: LoanType;
    interestRate?: number;               // annual %
    pointsPct?: number;                  // %
    termMonths?: number;                 // optional, for long-term loans
    termYears?: number;                  // UX convenience; we map to termMonths if given
    downPayment?: number;                // $
    ltvPct?: number;                     // %
  };
  holdingMonthly?: HoldingMonthly;       // monthly carry during hold/rehab
  selling?: SellingBreakdown;            // Flip selling costs
  sellingCostPct?: number;               // fallback simple % of ARV (unused if breakdown present)
  closingCosts?: number;                 // total closing costs from itemized module
};

export type DealOutputs = {
  salePrice: number;
  loanAmount: number;
  financingCost: number;     // points + interest
  holdingCost: number;       // monthly carry * months
  sellingCost: number;       // agent + itemized closing/marketing/moving
  closingCost: number;       // purchase + exit closing total
  totalInvestment: number;   // cash in + above costs
  profit: number;            // ARV - (all-in)
  roi: number;               // profit / totalInvestment
  warnings: string[];
};

const num = (v?: number) => (typeof v === 'number' && isFinite(v) ? v : 0);

export function analyzeFlip(inp: DealInputs): DealOutputs {
  const months = Math.max(0, num(inp.monthsToComplete));
  const salePrice = num(inp.arv);

  // Normalize term
  const termMonths = inp.loan.termMonths || (inp.loan.termYears ? inp.loan.termYears * 12 : undefined);

  // Loan sizing
  const pp = num(inp.purchasePrice);
  const arv = num(inp.arv);
  const dp = num(inp.loan.downPayment);
  const ltv = (inp.loan.ltvPct ?? 80) / 100;

  let loanAmount = 0;
  if (inp.loan.type === 'cash') {
    loanAmount = 0;
  } else if (inp.loan.type === 'hard_money') {
    const cap = arv > 0 ? arv * ltv : pp * ltv;
    loanAmount = Math.min(cap, pp);
  } else {
    loanAmount = Math.min(pp * ltv, pp - dp);
  }
  loanAmount = Math.max(0, loanAmount);

  // Financing costs (points + interest-only during holding period)
  const rate = (inp.loan.interestRate ?? 0) / 100;
  const points = loanAmount * (num(inp.loan.pointsPct) / 100);
  const interest = loanAmount * rate * (months / 12);
  const financingCost = points + interest;

  // Holding costs
  const h = inp.holdingMonthly || {};
  const holdingMonthly = num(h.taxes) + num(h.insurance) + num(h.utilities) + num(h.hoa) + num(h.maintenance);
  const holdingCost = holdingMonthly * months;

  // Selling cost breakdown (preferred)
  const s = inp.selling || {};
  const agent = salePrice * (num(s.agentCommissionPct) / 100);
  const itemized = num(s.titleEscrow) + num(s.transferTaxesRecording) + num(s.attorney) + num(s.marketing) + num(s.sellerMoving) + num(s.other);
  let sellingCost = agent + itemized;

  // Fallback simple % if no breakdown provided
  if (sellingCost === 0 && inp.sellingCostPct != null) {
    sellingCost = salePrice * (num(inp.sellingCostPct) / 100);
  }

  const closingCost = num(inp.closingCosts);

  // Total investment (actual cash out)
  const cashPortion = Math.max(0, pp - loanAmount) + num(inp.rehabCost);
  const totalInvestment = cashPortion + financingCost + holdingCost + sellingCost + closingCost;

  const profit = salePrice - (pp + num(inp.rehabCost) + financingCost + holdingCost + sellingCost + closingCost);
  const roi = totalInvestment > 0 ? profit / totalInvestment : 0;

  const warnings: string[] = [];
  if (roi < 0) warnings.push('Negative ROI — review assumptions.');
  if (inp.loan.type !== 'cash' && months > 0 && rate === 0) warnings.push('Interest rate is 0% but a financed loan is selected.');
  if (inp.loan.type === 'hard_money' && (termMonths ?? 0) > 12) warnings.push('Hard money term > 12 months is uncommon.');

  return { salePrice, loanAmount, financingCost, holdingCost, sellingCost, closingCost, totalInvestment, profit, roi, warnings };
}

export function analyze(inputs: DealInputs): DealOutputs {
  // For now, we’re upgrading Flip; BuyHold/BRRRR can dispatch to their modules if present.
  if (inputs.mode === 'flip') return analyzeFlip(inputs);
  // fallback
  return analyzeFlip(inputs);
}
