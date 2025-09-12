import { CalcBases, DealInput, RentalKPIs, FlipKPIs } from "./types";

export const pmt = (rateMonthly: number, nper: number, pv: number) => {
  if (rateMonthly === 0) return -(pv / nper);
  return -(pv * rateMonthly) / (1 - Math.pow(1 + rateMonthly, -nper));
};

export function rentalKPIs(d: DealInput, bases: CalcBases): RentalKPIs {
  const gar = d.rent * 12;
  const vacancy = gar * (d.vacancyPct / 100);
  const egi = gar - vacancy;

  const percentBase = bases.percentBasis === "egi" ? egi : gar;
  const mgmt = percentBase * (d.managementPct / 100);
  const maint = percentBase * (d.maintenancePct / 100);
  const varOpEx = mgmt + maint; // vacancy is shown above the line for EGI but included in opEx
  const fixedOpEx = d.taxes + d.insurance + d.hoaMonthly * 12 + d.otherMonthly * 12;
  const opEx = varOpEx + fixedOpEx + vacancy;

  const noi = egi - varOpEx - fixedOpEx;

  const allIn = d.purchase + d.rehab;
  const loanBase = bases.loanBasis === "purchase" ? d.purchase : allIn;
  const loanAmount = loanBase * (1 - d.downPct / 100);
  const mRate = d.ratePct / 100 / 12;
  const n = d.termYears * 12;
  const pmtMonthly = Math.abs(pmt(mRate, n, loanAmount));
  const annualDebt = pmtMonthly * 12;

  const dscr = annualDebt ? noi / annualDebt : NaN;
  const annualCF = noi - annualDebt;

  let invested = 0;
  if (bases.investedBasis === "down") invested = (d.downPct / 100) * loanBase;
  if (bases.investedBasis === "down_plus_rehab") invested = (d.downPct / 100) * loanBase + d.rehab;
  if (bases.investedBasis === "down_plus_rehab_closing") invested = (d.downPct / 100) * loanBase + d.rehab; // + closing when modeled

  const capDen = bases.capBasis === "purchase" ? d.purchase : allIn;
  const capRate = capDen ? noi / capDen : NaN;
  const breakEvenRent = (opEx + annualDebt) / 12;
  const grmDen = bases.capBasis === "purchase" ? d.purchase : allIn;
  const grm = gar ? grmDen / gar : NaN;
  const grossYield = capDen ? gar / grmDen : NaN;
  const oer = gar ? opEx / gar : NaN;

  return {
    gar, vacancy, egi, varOpEx, fixedOpEx, opEx, noi,
    allIn, loanAmount, pmtMonthly, annualDebt, dscr, annualCF,
    capRate, invested, coc: invested ? annualCF / invested : NaN,
    breakEvenRent, grm, grossYield, oer,
    explain: {
      GAR: `rent*12=${d.rent}*12=${gar}`,
      Vacancy: `${d.vacancyPct}%*GAR=${vacancy}`,
      EGI: `GAR-Vacancy=${egi}`,
      Mgmt: `${d.managementPct}%*${bases.percentBasis}=${mgmt}`,
      Maint: `${d.maintenancePct}%*${bases.percentBasis}=${maint}`,
      Fixed: `tax+ins+hoa*12+other*12=${fixedOpEx}`,
      NOI: `${bases.percentBasis==="egi"?"EGI":"GAR"}-VarOpEx-Fixed=${noi}`,
      Loan: `${bases.loanBasis}* (1-down%)=${loanAmount}`,
      PMT: `pmt(${(d.ratePct/12).toFixed(5)}, ${n}, ${loanAmount.toFixed(0)})=${pmtMonthly.toFixed(2)}`
    }
  };
}

export function flipKPIs(d: DealInput): FlipKPIs {
  const basis = d.purchase + d.rehab;
  const down = basis * (d.downPct / 100);
  const loan = basis - down;
  const interestCarry = loan * (d.ratePct / 100) * ((d.holdingMonths ?? 0) / 12);
  const otherCarry = (d.carryOtherMonthly ?? 0) * (d.holdingMonths ?? 0);
  const selling = d.arv * ((d.sellingCostPct ?? 0) / 100);
  const closing = d.arv * ((d.closingCostPct ?? 0) / 100);
  const totalCost = basis + interestCarry + otherCarry + selling + closing;
  const profit = d.arv - totalCost;
  const margin = d.arv ? profit / d.arv : NaN;
  const equityMultiple = (down + d.rehab) ? (down + d.rehab + profit) / (down + d.rehab) : NaN;

  return {
    basis, down, loan, interestCarry, otherCarry, selling, closing,
    totalCost, profit, margin, equityMultiple,
    explain: {
      Basis: `purchase+rehab=${basis}`,
      Interest: `loan*rate*months/12=${interestCarry}`
    }
  };
}

export function sizeLoanToDSCR(noiAnnual: number, ratePct: number, termYears: number, targetDSCR: number): { maxAnnualDebt: number; loan: number; pmtMonthly: number } {
  const maxAnnualDebt = noiAnnual / targetDSCR;
  const mRate = ratePct / 100 / 12;
  const n = termYears * 12;
  const monthly = maxAnnualDebt / 12;
  const loan = mRate === 0 ? monthly * n : monthly * (1 - Math.pow(1 + mRate, -n)) / mRate;
  return { maxAnnualDebt, loan, pmtMonthly: monthly };
}
