import assert from "assert/strict";
import { compositeScore, normalize } from "../../lib/compare/score";

const ranges = {
  dscr: [0, 2],
  cap: [0, 0.1],
  cf: [-10000, 10000],
  profit: [-50000, 50000],
};

const weights = { dscr: 40, cap: 30, cf: 20, profit: 10 };

// Score is bounded between 0 and 1
const bounded = compositeScore(
  { dscr: 1.2, capRate: 0.05, annualCF: 2000, profit: 10000 },
  weights,
  ranges
);
assert.ok(bounded >= 0 && bounded <= 1, "score should be within [0,1]");

// Increasing DSCR increases score (monotonic)
const scoreLow = compositeScore(
  { dscr: 0.8, capRate: 0.05, annualCF: 2000, profit: 10000 },
  weights,
  ranges
);
const scoreHigh = compositeScore(
  { dscr: 1.6, capRate: 0.05, annualCF: 2000, profit: 10000 },
  weights,
  ranges
);
assert.ok(scoreHigh > scoreLow, "higher dscr should yield higher score");

// normalize clamps values
assert.equal(normalize(-1, 0, 1), 0);
assert.equal(normalize(2, 0, 1), 1);

console.log("score tests passed");
