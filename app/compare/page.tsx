import type { Metadata } from "next";
import CompareClient from "./CompareClient";

export const metadata: Metadata = {
  title: "Deal Comparison • REtotalAi",
  description: "Compare rental/BRRRR/flip deals with DSCR, Cap, CF, Profit.",
};

export const dynamic = "force-dynamic";

export default function ComparePage() {
  return <CompareClient />;
}
