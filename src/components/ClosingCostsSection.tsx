import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";

// ---------------------------
// Types & Data Model
// ---------------------------
export type ExitKind = "sale" | "refi";
export type ItemType = "fixed" | "percent";
export type Basis = "loan_amount" | "purchase_price" | "sale_price" | "refi_loan";

export interface ClosingCostItem {
  id: string;
  name: string;
  type: ItemType; // "fixed" = absolute $, "percent" = % of basis
  basis: Basis;   // which number the % applies to (ignored for fixed)
  value: number;  // dollars if fixed, percent if type === "percent"
}

export interface ClosingCostBases {
  loan_amount: number;
  purchase_price: number;
  sale_price?: number | null;
  refi_loan?: number | null;
}

export interface Totals {
  purchase: number;
  exit: number;
  total: number;
  financeable: number;
}

export interface ClosingCostsSectionProps {
  title?: string;
  exitKind: ExitKind;                       // determines which bases are selectable
  bases: ClosingCostBases;                  // dollar amounts to compute from
  value: ClosingCostItem[];                 // controlled list of items
  onChange: (items: ClosingCostItem[], total: number) => void;
  collapsedByDefault?: boolean;
}

// ---------------------------
// Helpers
// ---------------------------
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "id_" + Math.random().toString(36).slice(2, 10);

const labelForBasis: Record<Basis, string> = {
  loan_amount: "Loan Amount",
  purchase_price: "Purchase Price",
  sale_price: "Sale Price",
  refi_loan: "Refi Loan Amount",
};

function getBasisAmount(bases: ClosingCostBases, basis: Basis): number {
  switch (basis) {
    case "loan_amount":
      return bases.loan_amount ?? 0;
    case "purchase_price":
      return bases.purchase_price ?? 0;
    case "sale_price":
      return bases.sale_price ?? 0;
    case "refi_loan":
      return bases.refi_loan ?? 0;
    default:
      return 0;
  }
}

export function computeItemAmount(
  item: ClosingCostItem,
  bases: ClosingCostBases
): number {
  if (item.type === "fixed") return Math.max(0, item.value || 0);
  const basisAmt = getBasisAmount(bases, item.basis);
  const pct = (item.value || 0) / 100;
  return Math.max(0, basisAmt * pct);
}

export function computeTotal(items: ClosingCostItem[], bases: ClosingCostBases): number {
  return items.reduce((sum, it) => sum + computeItemAmount(it, bases), 0);
}

// ---------------------------
// Component
// ---------------------------
export const ClosingCostsSection: FC<ClosingCostsSectionProps> = ({
  title = "Closing Costs",
  exitKind,
  bases,
  value,
  onChange,
  collapsedByDefault = false,
}) => {
  const [open, setOpen] = useState(!collapsedByDefault);
  const [items, setItems] = useState<ClosingCostItem[]>(value);

  // Keep internal state in sync with controlled prop
  useEffect(() => {
    setItems(value);
  }, [value]);

  const selectableBases = useMemo<Basis[]>(() => {
    const common: Basis[] = ["loan_amount", "purchase_price"];
    if (exitKind === "sale") return [...common, "sale_price"];
    if (exitKind === "refi") return [...common, "refi_loan"];
    return common;
  }, [exitKind]);

  const total = useMemo(() => computeTotal(items, bases), [items, bases]);

  // Notify parent when items or bases change (computed total is a stable derivation).
  useEffect(() => {
    onChange(items, total);
  }, [items, total, onChange]);

  const addItem = useCallback(() => {
    const defaultBasis: Basis = selectableBases[0] ?? "loan_amount";
    setItems((prev) => [
      ...prev,
      {
        id: uid(),
        name: "New Cost",
        type: "fixed",
        basis: defaultBasis,
        value: 0,
      },
    ]);
  }, [selectableBases]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateItem = useCallback(
    (id: string, patch: Partial<ClosingCostItem>) => {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
      );
    },
    []
  );

  const onNameChange = (id: string) => (e: ChangeEvent<HTMLInputElement>) =>
    updateItem(id, { name: e.target.value });

  const onTypeChange = (id: string) => (e: ChangeEvent<HTMLSelectElement>) =>
    updateItem(id, { type: e.target.value as ItemType });

  const onBasisChange = (id: string) => (e: ChangeEvent<HTMLSelectElement>) =>
    updateItem(id, { basis: e.target.value as Basis });

  const onValueChange = (id: string) => (e: ChangeEvent<HTMLInputElement>) =>
    updateItem(id, { value: Number(e.target.value) || 0 });

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mb-3 flex w-full items-center justify-between rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-left"
      >
        <span className="font-medium">{title}</span>
        <span className="text-sm text-neutral-500">
          {open ? "Hide" : "Show"} · Total: ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="space-y-2">
              {items.length === 0 && (
                <div className="rounded-md border border-dashed border-neutral-300 p-3 text-sm text-neutral-500">
                  No closing costs yet. Add your first item below.
                </div>
              )}

              {items.map((it) => {
                const computed = computeItemAmount(it, bases);
                return (
                  <div
                    key={it.id}
                    className="grid grid-cols-12 items-center gap-2 rounded-md border border-neutral-200 p-2"
                  >
                    <input
                      className="col-span-4 rounded-md border px-2 py-1"
                      placeholder="Item name"
                      value={it.name}
                      onChange={onNameChange(it.id)}
                    />

                    <select
                      className="col-span-2 rounded-md border px-2 py-1"
                      value={it.type}
                      onChange={onTypeChange(it.id)}
                    >
                      <option value="fixed">Fixed $</option>
                      <option value="percent">% of Basis</option>
                    </select>

                    <select
                      className="col-span-3 rounded-md border px-2 py-1 disabled:opacity-50"
                      value={it.basis}
                      onChange={onBasisChange(it.id)}
                      disabled={it.type === "fixed"}
                    >
                      {selectableBases.map((b) => (
                        <option key={b} value={b}>
                          {labelForBasis[b]}
                        </option>
                      ))}
                    </select>

                    <div className="col-span-2 flex items-center gap-1">
                      <input
                        className="w-full rounded-md border px-2 py-1 text-right"
                        type="number"
                        min={0}
                        step={it.type === "percent" ? 0.01 : 1}
                        value={Number.isFinite(it.value) ? it.value : 0}
                        onChange={onValueChange(it.id)}
                      />
                      <span className="text-sm text-neutral-500">
                        {it.type === "percent" ? "%" : "$"}
                      </span>
                    </div>

                    <button
                      type="button"
                      aria-label="Remove item"
                      className="col-span-1 flex items-center justify-center rounded-md border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100"
                      onClick={() => removeItem(it.id)}
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="col-span-12 text-right text-sm text-neutral-600">
                      Line total: ${computed.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 hover:bg-neutral-50"
                >
                  <Plus size={16} /> Add Cost
                </button>

                <div className="text-right text-base font-semibold">
                  Total Closing Costs: ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClosingCostsSection;
