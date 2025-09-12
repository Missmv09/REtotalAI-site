export interface CalcBases {
  loanBasis: string;
  percentBasis: string;
  capBasis: string;
  investedBasis: string;
}

export interface CalcModePreset {
  id: string;
  bases: CalcBases;
}
