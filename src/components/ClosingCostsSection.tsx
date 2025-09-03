import React from "react";

export interface Totals {
  purchase: number;
  exit: number;
  total: number;
  financeable: number;
}

export default function ClosingCostsSection(
  _props: { bases: any; onChange?: (state: any, totals: Totals) => void }
) {
  return null;
}
