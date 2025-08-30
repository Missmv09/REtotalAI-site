export function calculateAnalysis(data) {
  const {
    purchasePrice,
    rehabBudget,
    arv,
    rentalIncome,
    financingType,
    loanPercent,
    pointsPercent,
    hardInterestRate,
    downPaymentPercent,
    traditionalInterestRate,
    operatingExpensePercent,
    rehabDuration,
  } = data;

  const operatingExpenses = rentalIncome * (operatingExpensePercent / 100);
  let roi = 0;
  let monthlyCashFlow = 0;
  let capRate = 0;
  let totalProjectCost = purchasePrice + rehabBudget;
  let profitOnSale = null;

  if (financingType === 'Hard Money') {
    const loanAmount = purchasePrice * (loanPercent / 100);
    const pointsCost = loanAmount * (pointsPercent / 100);
    const interestCost =
      (loanAmount * (hardInterestRate / 100)) / 12 * rehabDuration;

    totalProjectCost += pointsCost + interestCost;

    const monthlyDebt = (loanAmount * (hardInterestRate / 100)) / 12;
    monthlyCashFlow = rentalIncome - operatingExpenses - monthlyDebt;

    profitOnSale = arv - totalProjectCost;

    const cashInvested =
      purchasePrice - loanAmount + rehabBudget + pointsCost + interestCost;
    roi = cashInvested > 0 ? (profitOnSale / cashInvested) * 100 : 0;

    capRate =
      totalProjectCost > 0
        ? ((rentalIncome - operatingExpenses) * 12) / totalProjectCost * 100
        : 0;
  } else {
    const downPayment = purchasePrice * (downPaymentPercent / 100);
    const loanAmount = purchasePrice - downPayment;
    const monthlyRate = (traditionalInterestRate / 100) / 12;
    const numPayments = 30 * 12;
    let monthlyMortgage;
    if (monthlyRate === 0) {
      monthlyMortgage = loanAmount / numPayments;
    } else {
      monthlyMortgage =
        loanAmount *
        ((monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
          (Math.pow(1 + monthlyRate, numPayments) - 1));
    }

    monthlyCashFlow = rentalIncome - operatingExpenses - monthlyMortgage;

    capRate =
      totalProjectCost > 0
        ? ((rentalIncome - operatingExpenses) * 12) / totalProjectCost * 100
        : 0;

    const cashInvested = downPayment + rehabBudget;
    roi = cashInvested > 0 ? ((monthlyCashFlow * 12) / cashInvested) * 100 : 0;
  }

  const rawScore = (roi / 10) + (capRate / 10) + (monthlyCashFlow > 0 ? 1 : 0);
  const score = Math.max(0, Math.min(10, Math.round(rawScore)));

  let emoji;
  if (score >= 8) emoji = '💸';
  else if (score >= 5) emoji = '🔥';
  else emoji = '🚩';

  return {
    roi,
    monthlyCashFlow,
    capRate,
    totalProjectCost,
    profitOnSale,
    score,
    emoji,
  };
}
