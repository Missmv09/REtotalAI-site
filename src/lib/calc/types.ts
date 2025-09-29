export type Strategy = "hold" | "brrrr" | "flip";
export type LoanBasis = "purchase" | "all_in";
export type PercentBasis = "gross" | "egi"; // EGI = rent - vacancy
export type CapBasis = "purchase" | "all_in";
export type InvestedBasis = "down" | "down_plus_rehab" | "down_plus_rehab_closing";

export interface DealInput {
  purchase: number; arv: number; rehab: number; rent: number;
  taxes: number; insurance: number; hoaMonthly: number; otherMonthly: number;
  vacancyPct: number; managementPct: number; maintenancePct: number;
  downPct: number; ratePct: number; termYears: number;
  holdingMonths?: number; carryOtherMonthly?: number;
  sellingCostPct?: number; closingCostPct?: number; closingCosts?: number;
}

export interface CalcBases {
  loanBasis: LoanBasis;
  percentBasis: PercentBasis;
  capBasis: CapBasis;
  investedBasis: InvestedBasis;
}

export interface CalcModePreset {
  id: "Conservative" | "Lender" | "Broker" | "DealCheck" | "Custom";
  bases: CalcBases;
  notes?: string[];
}

export interface RentalKPIs {
  gar: number; vacancy: number; egi: number;
  varOpEx: number; fixedOpEx: number; opEx: number; noi: number;
  allIn: number; loanAmount: number; pmtMonthly: number; annualDebt: number;
  dscr: number; annualCF: number; capRate: number;
  invested: number; coc: number; breakEvenRent: number;
  grm: number; grossYield: number; oer: number;
  explain: Record<string, string>;
}

export interface FlipKPIs {
  basis: number; down: number; loan: number;
  interestCarry: number; otherCarry: number; selling: number; closing: number;
  totalCost: number; profit: number; margin: number; equityMultiple: number;
  explain: Record<string, string>;
}
