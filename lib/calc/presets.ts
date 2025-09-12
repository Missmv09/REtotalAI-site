import type { CalcModePreset } from './types';

export const CalcPresets: CalcModePreset[] = [
  { id: 'Balanced', bases: { loanBasis: 'purchase', percentBasis: 'purchase', capBasis: 'purchase', investedBasis: 'cash' } },
  { id: 'Aggressive', bases: { loanBasis: 'arv', percentBasis: 'arv', capBasis: 'arv', investedBasis: 'cash' } },
];
