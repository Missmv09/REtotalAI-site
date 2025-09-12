export type LoanBasis = "purchase" | "all_in";
export type PercentBasis = "gross" | "egi";
export type CapBasis = "purchase" | "all_in";
export type InvestedBasis = "down" | "down_plus_rehab" | "down_plus_rehab_closing";

export interface CalcBases {
  loanBasis: LoanBasis;
  percentBasis: PercentBasis;
  capBasis: CapBasis;
  investedBasis: InvestedBasis;
}

export interface CalcModePreset {
  id: string;
  bases: CalcBases;
}
