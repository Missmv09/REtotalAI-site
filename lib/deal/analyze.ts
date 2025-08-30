export type LoanType = 'cash' | 'hard_money' | 'conventional' | 'dscr';

export type DealInputs = {
  purchasePrice: number;
  rehabCost: number;
  arv?: number;
  monthsToComplete: number;         // holding months
  sellingCostPct?: number;          // % of ARV, default 8
  loan: {
    type: LoanType;
    interestRate?: number;          // annual %
    pointsPct?: number;             // origination points %
    termMonths?: number;
    downPayment?: number;           // absolute dollars (optional)
    ltvPct?: number;                // for HM/Conv/DSCR (optional)
  };
  holdingMonthly?: {
    taxes?: number; insurance?: number; utilities?: number; hoa?: number; maintenance?: number;
  };
};

export type DealOutputs = {
  totalInvestment: number;
  financingCost: number;
  holdingCost: number;
  sellingCost: number;
  profit: number;
  roi: number;
  warnings: string[];
};

const num = (v?: number) => (typeof v === 'number' && !isNaN(v) ? v : 0);

export function analyze(inp: DealInputs): DealOutputs {
  const months = Math.max(0, inp.monthsToComplete || 0);
  const sellingPct = (inp.sellingCostPct ?? 8) / 100;

  // ----- Loan amount rules -----
  const pp = num(inp.purchasePrice);
  const arv = num(inp.arv);
  const dp = num(inp.loan.downPayment);
  const ltv = (inp.loan.ltvPct ?? 80) / 100;

  let loanAmount = 0;
  if (inp.loan.type === 'cash') {
    loanAmount = 0;
  } else if (inp.loan.type === 'hard_money') {
    // HM often lends against ARV; conservative: min(ltv*ARV, purchasePrice)
    const hmCap = arv > 0 ? arv * ltv : pp * ltv;
    loanAmount = Math.min(hmCap, pp);
  } else {
    // conventional/dscr typically against purchase price
    loanAmount = Math.min(pp * ltv, pp - dp);
  }
  loanAmount = Math.max(0, loanAmount);

  // Points + interest (assume interest-only during hold)
  const rate = (inp.loan.interestRate ?? 0) / 100;
  const points = loanAmount * (num(inp.loan.pointsPct) / 100);
  const interest = loanAmount * rate * (months / 12);

  const financingCost = points + interest;

  // Holding costs (monthly sum × months)
  const m = inp.holdingMonthly || {};
  const holdingMonthly =
    num(m.taxes) + num(m.insurance) + num(m.utilities) + num(m.hoa) + num(m.maintenance);
  const holdingCost = holdingMonthly * months;

  // Selling costs (% of ARV)
  const sellingCost = arv * sellingPct;

  // Total investment (cash actually out the door)
  const cashPortion = Math.max(0, pp - loanAmount) + num(inp.rehabCost);
  const totalInvestment = cashPortion + financingCost + holdingCost + sellingCost;

  // Profit on flip
  const profit = arv - (pp + num(inp.rehabCost) + financingCost + holdingCost + sellingCost);

  const roi = totalInvestment > 0 ? profit / totalInvestment : 0;

  const warnings: string[] = [];
  if (roi < 0) warnings.push('Negative ROI — check assumptions.');
  if (inp.loan.type !== 'cash' && months > 0 && rate === 0) warnings.push('Interest rate is 0% but loan type is financed.');

  return { totalInvestment, financingCost, holdingCost, sellingCost, profit, roi, warnings };
}
