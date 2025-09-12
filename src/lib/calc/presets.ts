import { CalcModePreset } from "./types";

export const CalcPresets: CalcModePreset[] = [
  {
    id: "DealCheck",
    bases: {
      loanBasis: "purchase",
      percentBasis: "egi",
      capBasis: "purchase",
      investedBasis: "down"
    },
    notes: ["Parity with DealCheck UX: % on EGI, cap/grm on purchase, invested=down."]
  },
  {
    id: "Lender",
    bases: {
      loanBasis: "purchase",
      percentBasis: "egi",
      capBasis: "purchase",
      investedBasis: "down_plus_rehab_closing"
    },
    notes: ["Bank view; conservative invested basis; use with DSCR sizing."]
  },
  {
    id: "Conservative",
    bases: {
      loanBasis: "all_in",
      percentBasis: "gross",
      capBasis: "all_in",
      investedBasis: "down_plus_rehab"
    },
    notes: ["Conservative underwriting; all-in denominators."]
  },
  {
    id: "Broker",
    bases: {
      loanBasis: "purchase",
      percentBasis: "gross",
      capBasis: "purchase",
      investedBasis: "down"
    },
    notes: ["Marketing view; simpler % basis."]
  },
  {
    id: "Custom",
    bases: {
      loanBasis: "purchase",
      percentBasis: "egi",
      capBasis: "purchase",
      investedBasis: "down"
    }
  }
];
