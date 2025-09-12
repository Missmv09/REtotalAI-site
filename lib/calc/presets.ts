import type { CalcModePreset } from './types';

export const CalcPresets: CalcModePreset[] = [
  {
    id: 'Balanced',
    bases: {
      loanBasis: 'purchase',
      percentBasis: 'gross',
      capBasis: 'purchase',
      investedBasis: 'down_plus_rehab',
    },
  },
  {
    id: 'Aggressive',
    bases: {
      loanBasis: 'all_in',
      percentBasis: 'egi',
      capBasis: 'all_in',
      investedBasis: 'down_plus_rehab_closing',
    },
  },
];

