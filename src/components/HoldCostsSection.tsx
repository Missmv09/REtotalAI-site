import React from "react";

export interface HoldTotals {
  monthly: number;
  oneTime: number;
  monthsHeld: number;
  total: number;
}

export default function HoldCostsSection(
  _props: { kind: string; bases: any; onChange?: (state: any, totals: HoldTotals) => void }
) {
  return null;
}
