"use client";
import { useCompareSet } from "@/compare/compareStore";

export function AddToCompareButton({ dealId }: { dealId: string }) {
  const { ids, add, remove } = useCompareSet();
  const added = ids.includes(dealId);
  return (
    <button
      onClick={() => (added ? remove(dealId) : add(dealId))}
      className={`btn ${added ? "btn-outline" : "btn-primary"}`}
      aria-pressed={added}
    >
      {added ? "Remove from Compare" : "Add to Compare"}
    </button>
  );
}
