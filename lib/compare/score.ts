export interface ScoreWeights {
  dscr: number;
  cap: number;
  cf: number;
  profit: number;
}

export interface ScoreInputs {
  dscr?: number;
  capRate?: number;
  annualCF?: number;
  profit?: number;
}

export function normalize(val: number | undefined, min: number, max: number) {
  if (val === undefined || Number.isNaN(val)) return 0;
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (val - min) / (max - min)));
}

export function compositeScore(
  inp: ScoreInputs,
  w: ScoreWeights,
  ranges: {
    dscr: [number, number];
    cap: [number, number];
    cf: [number, number];
    profit: [number, number];
  }
) {
  const sDSCR = normalize(inp.dscr, ranges.dscr[0], ranges.dscr[1]) * w.dscr;
  const sCap = normalize(inp.capRate, ranges.cap[0], ranges.cap[1]) * w.cap;
  const sCF = normalize(inp.annualCF, ranges.cf[0], ranges.cf[1]) * w.cf;
  const sPft = normalize(inp.profit, ranges.profit[0], ranges.profit[1]) * w.profit;
  const sumW = w.dscr + w.cap + w.cf + w.profit || 1;
  return (sDSCR + sCap + sCF + sPft) / sumW;
}
