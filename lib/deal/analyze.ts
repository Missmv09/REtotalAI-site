export type DealInputs = {
  purchasePrice: number;
  rehabCost: number;
  arv: number;
  loanAmount: number;
  interestRate: number; // annual rate e.g. 0.08
  monthlyIncome: number;
  holdingMonths: number;
};

export type DealOutputs = {
  cashNeeded: number;
  profit: number;
  roi: number;
  dscr: number;
  breakevenARV: number;
  warnings: string[];
};

export function analyze(inputs: DealInputs): DealOutputs {
  const cashNeeded = inputs.purchasePrice + inputs.rehabCost - inputs.loanAmount;
  const profit = inputs.arv - inputs.purchasePrice - inputs.rehabCost;
  const roi = cashNeeded !== 0 ? profit / cashNeeded : 0;
  const monthlyDebtService = inputs.loanAmount * inputs.interestRate / 12;
  const dscr = monthlyDebtService !== 0 ? inputs.monthlyIncome / monthlyDebtService : 0;
  const breakevenARV = inputs.purchasePrice + inputs.rehabCost + cashNeeded;

  const warnings: string[] = [];
  // stress test: +200bps rate, +10% rehab cost
  const stressedDebtService = inputs.loanAmount * (inputs.interestRate + 0.02) / 12;
  const stressedDSCR = stressedDebtService !== 0 ? inputs.monthlyIncome / stressedDebtService : 0;
  const stressedROI = (inputs.arv - inputs.purchasePrice - inputs.rehabCost * 1.1) /
    (inputs.purchasePrice + inputs.rehabCost * 1.1 - inputs.loanAmount);
  if (stressedDSCR < 1) {
    warnings.push('DSCR below 1.0 under stress test');
  }
  if (stressedROI < 0) {
    warnings.push('Negative ROI under stress test');
  }

  return { cashNeeded, profit, roi, dscr, breakevenARV, warnings };
}
