import React, { useMemo, useState } from "react";
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
  type: ItemType; // fixed | percent
  basis?: Basis; // required when type === 'percent'
  value: number; // dollars (fixed) or percentage number (e.g. 1.5 for 1.5%)
  isFinanceable?: boolean; // if true, subtract from cash to close
}

export interface ClosingCostsState {
  mode: "simple" | "itemized";
  exitKind: ExitKind; // sale for flips or refi for BRRRR
  simple?: {
    purchaseTotal: number;
    exitTotal: number; // sale/exit or refi costs
  };
  purchaseItems?: ClosingCostItem[];
  exitItems?: ClosingCostItem[]; // depends on exitKind
}

export interface Bases {
  purchasePrice: number;
  loanAmount: number;
  salePrice?: number; // when exitKind === 'sale'
  refiLoan?: number; // when exitKind === 'refi'
}

export interface Totals {
  purchase: number;
  exit: number;
  total: number;
  financeable: number; // portion flagged as financeable
}

export interface ClosingCostsProps {
  value?: ClosingCostsState;
  bases: Bases;
  onChange?: (state: ClosingCostsState, totals: Totals) => void;
  className?: string;
}

// ---------------------------
// Default Seeds
// ---------------------------
const seedPurchaseItems = (): ClosingCostItem[] => [
  { id: crypto.randomUUID(), name: "Origination Points", type: "percent", basis: "loan_amount", value: 1.0 },
  { id: crypto.randomUUID(), name: "Title / Escrow", type: "fixed", value: 1200 },
  { id: crypto.randomUUID(), name: "Underwriting / Processing", type: "fixed", value: 900 },
  { id: crypto.randomUUID(), name: "Appraisal", type: "fixed", value: 600 },
  { id: crypto.randomUUID(), name: "Recording & Transfer Tax", type: "percent", basis: "purchase_price", value: 0.5 },
  { id: crypto.randomUUID(), name: "Inspection(s)", type: "fixed", value: 400 },
  { id: crypto.randomUUID(), name: "Misc / Buffer", type: "fixed", value: 300 },
];

const seedExitItems = (kind: ExitKind): ClosingCostItem[] => {
  if (kind === "sale") {
    return [
      { id: crypto.randomUUID(), name: "Listing Commission", type: "percent", basis: "sale_price", value: 5.0 },
      { id: crypto.randomUUID(), name: "Seller Concessions", type: "percent", basis: "sale_price", value: 0.0 },
      { id: crypto.randomUUID(), name: "Title / Settlement", type: "fixed", value: 1000 },
      { id: crypto.randomUUID(), name: "Transfer / Doc Stamps", type: "percent", basis: "sale_price", value: 0.5 },
      { id: crypto.randomUUID(), name: "Recording Fees", type: "fixed", value: 150 },
      { id: crypto.randomUUID(), name: "Attorney", type: "fixed", value: 500 },
      { id: crypto.randomUUID(), name: "Misc", type: "fixed", value: 300 },
    ];
  }
  // refi
  return [
    { id: crypto.randomUUID(), name: "Refi Points / Origination", type: "percent", basis: "refi_loan", value: 1.0 },
    { id: crypto.randomUUID(), name: "Underwriting / Processing", type: "fixed", value: 900 },
    { id: crypto.randomUUID(), name: "Appraisal", type: "fixed", value: 600 },
    { id: crypto.randomUUID(), name: "Title / Settlement", type: "fixed", value: 1000 },
    { id: crypto.randomUUID(), name: "Recording / Doc Stamps", type: "percent", basis: "refi_loan", value: 0.5 },
    { id: crypto.randomUUID(), name: "Misc", type: "fixed", value: 300 },
  ];
};

// ---------------------------
// Helpers
// ---------------------------
const clampToNumber = (n: any) => (Number.isFinite(Number(n)) ? Number(n) : 0);
const fmtUSD = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function computeItemAmount(item: ClosingCostItem, bases: Bases): number {
  if (item.type === "fixed") return clampToNumber(item.value);
  const pct = clampToNumber(item.value) / 100;
  const basis = item.basis;
  if (!basis) return 0;
  switch (basis) {
    case "loan_amount":
      return bases.loanAmount * pct;
    case "purchase_price":
      return bases.purchasePrice * pct;
    case "sale_price":
      return (bases.salePrice ?? 0) * pct;
    case "refi_loan":
      return (bases.refiLoan ?? 0) * pct;
    default:
      return 0;
  }
}

function computeSubtotals(
  mode: "simple" | "itemized",
  exitKind: ExitKind,
  bases: Bases,
  simple: { purchaseTotal: number; exitTotal: number } | undefined,
  purchaseItems: ClosingCostItem[] | undefined,
  exitItems: ClosingCostItem[] | undefined
): Totals {
  if (mode === "simple") {
    const p = clampToNumber(simple?.purchaseTotal ?? 0);
    const e = clampToNumber(simple?.exitTotal ?? 0);
    return { purchase: p, exit: e, total: p + e, financeable: 0 };
  }
  const p = (purchaseItems ?? []).reduce((sum, it) => sum + computeItemAmount(it, bases), 0);
  const e = (exitItems ?? []).reduce((sum, it) => sum + computeItemAmount(it, bases), 0);
  const financeable = (purchaseItems ?? []).concat(exitItems ?? []).reduce((sum, it) => sum + (it.isFinanceable ? computeItemAmount(it, bases) : 0), 0);
  return { purchase: p, exit: e, total: p + e, financeable };
}

// ---------------------------
// Main Component
// ---------------------------
const FieldLabel: React.FC<{ label: string; hint?: string }> = ({ label, hint }) => (
  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
    <span>{label}</span>
    {hint ? (
      <span className="text-xs text-slate-400">{hint}</span>
    ) : null}
  </div>
);

const NumberInput: React.FC<{
  value: number | string;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
}> = ({ value, onChange, prefix, suffix, min }) => {
  return (
    <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      {prefix ? <span className="mr-1 text-slate-500">{prefix}</span> : null}
      <input
        inputMode="decimal"
        className="w-full outline-none"
        value={String(value ?? "")}
        onChange={(e) => onChange(clampToNumber(e.target.value))}
        min={min}
      />
      {suffix ? <span className="ml-1 text-slate-500">{suffix}</span> : null}
    </div>
  );
};

const InlineSelect: React.FC<{ value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }> = ({ value, onChange, options }) => (
  <select
    className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

const TableHeader: React.FC<{ exitKind: ExitKind }> = ({ exitKind }) => (
  <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
    <div className="col-span-4">Item</div>
    <div className="col-span-2">Type</div>
    <div className="col-span-3">Basis</div>
    <div className="col-span-2">Value</div>
    <div className="col-span-1 text-right">Actions</div>
  </div>
);

const ItemRow: React.FC<{
  item: ClosingCostItem;
  onChange: (patch: Partial<ClosingCostItem>) => void;
  onRemove: () => void;
  amount: number;
}> = ({ item, onChange, onRemove, amount }) => {
  return (
    <div className="grid grid-cols-12 items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
      <input
        className="col-span-4 rounded-lg border border-slate-200 px-3 py-2"
        value={item.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      <InlineSelect
        value={item.type}
        onChange={(v) => onChange({ type: v as ItemType })}
        options={[
          { value: "fixed", label: "Fixed $" },
          { value: "%", label: "%" },
        ]}
      />
      <div className="col-span-3">
        {item.type === "percent" ? (
          <InlineSelect
            value={item.basis ?? "loan_amount"}
            onChange={(v) => onChange({ basis: v as Basis })}
            options={[
              { value: "loan_amount", label: "Loan Amount" },
              { value: "purchase_price", label: "Purchase Price" },
              { value: "sale_price", label: "Sale Price" },
              { value: "refi_loan", label: "Refi Loan" },
            ]}
          />
        ) : (
          <div className="text-slate-400">—</div>
        )}
      </div>
      <div className="col-span-2">
        <NumberInput
          value={item.value}
          onChange={(n) => onChange({ value: n })}
          prefix={item.type === "fixed" ? "$" : undefined}
          suffix={item.type === "percent" ? "%" : undefined}
          min={0}
        />
      </div>
      <div className="col-span-1 flex items-center justify-end gap-2">
        <div className="text-sm font-semibold text-slate-700">{fmtUSD(amount)}</div>
        <button
          onClick={onRemove}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-500"
          title="Remove"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

// ---------------------------
// Component
// ---------------------------
export default function ClosingCostsSection({ value, bases, onChange, className }: ClosingCostsProps) {
  const [state, setState] = useState<ClosingCostsState>(() =>
    value ?? {
      mode: "itemized",
      exitKind: "sale",
      purchaseItems: seedPurchaseItems(),
      exitItems: seedExitItems("sale"),
      simple: { purchaseTotal: 0, exitTotal: 0 },
    }
  );

  const totals = useMemo(() => computeSubtotals(state.mode, state.exitKind, bases, state.simple, state.purchaseItems, state.exitItems), [state, bases]);

  const emit = (next: ClosingCostsState) => {
    const t = computeSubtotals(next.mode, next.exitKind, bases, next.simple, next.purchaseItems, next.exitItems);
    setState(next);
    onChange?.(next, t);
  };

  const switchMode = (mode: "simple" | "itemized") => {
    if (mode === state.mode) return;
    if (mode === "itemized") {
      // expand simple into seeded items scaled to approx totals
      const pItems = seedPurchaseItems();
      const eItems = seedExitItems(state.exitKind);
      const pSum = pItems.reduce((s, it) => s + computeItemAmount(it, bases), 0) || 1;
      const eSum = eItems.reduce((s, it) => s + computeItemAmount(it, bases), 0) || 1;
      const pScale = (state.simple?.purchaseTotal ?? pSum) / pSum;
      const eScale = (state.simple?.exitTotal ?? eSum) / eSum;
      pItems.forEach((it) => (it.type === "fixed" ? (it.value = Math.round(it.value * pScale)) : (it.value = Math.round(it.value * pScale * 10) / 10)));
      eItems.forEach((it) => (it.type === "fixed" ? (it.value = Math.round(it.value * eScale)) : (it.value = Math.round(it.value * eScale * 10) / 10)));
      emit({ ...state, mode, purchaseItems: pItems, exitItems: eItems });
    } else {
      emit({
        ...state,
        mode,
        simple: {
          purchaseTotal: computeSubtotals("itemized", state.exitKind, bases, undefined, state.purchaseItems, []).purchase,
          exitTotal: computeSubtotals("itemized", state.exitKind, bases, undefined, [], state.exitItems).exit,
        },
      });
    }
  };

  const switchExitKind = (kind: ExitKind) => {
    if (kind === state.exitKind) return;
    emit({
      ...state,
      exitKind: kind,
      exitItems: seedExitItems(kind),
    });
  };

  const updateItem = (scope: "purchase" | "exit", id: string, patch: Partial<ClosingCostItem>) => {
    const list = (scope === "purchase" ? state.purchaseItems : state.exitItems) ?? [];
    const nextList = list.map((it) => (it.id === id ? { ...it, ...patch } : it));
    emit({ ...state, [scope === "purchase" ? "purchaseItems" : "exitItems"]: nextList } as ClosingCostsState);
  };

  const removeItem = (scope: "purchase" | "exit", id: string) => {
    const list = (scope === "purchase" ? state.purchaseItems : state.exitItems) ?? [];
    const nextList = list.filter((it) => it.id !== id);
    emit({ ...state, [scope === "purchase" ? "purchaseItems" : "exitItems"]: nextList } as ClosingCostsState);
  };

  const addItem = (scope: "purchase" | "exit") => {
    const item: ClosingCostItem = {
      id: crypto.randomUUID(),
      name: "Custom Item",
      type: "fixed",
      value: 0,
    };
    const list = (scope === "purchase" ? state.purchaseItems : state.exitItems) ?? [];
    const nextList = [...list, item];
    emit({ ...state, [scope === "purchase" ? "purchaseItems" : "exitItems"]: nextList } as ClosingCostsState);
  };

  return (
    <div className={"w-full max-w-5xl rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm " + (className ?? "") }>
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Closing Costs</h2>
          <p className="text-sm text-slate-500">Choose simple total or itemized breakdown. Exit kind affects the right-side set.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <InlineSelect
            value={state.mode}
            onChange={(v) => switchMode(v as any)}
            options={[
              { value: "simple", label: "Simple (one total)" },
              { value: "itemized", label: "Itemized (breakout)" },
            ]}
          />
          <InlineSelect
            value={state.exitKind}
            onChange={(v) => switchExitKind(v as ExitKind)}
            options={[
              { value: "sale", label: "Exit = Sale" },
              { value: "refi", label: "Exit = Refi" },
            ]}
          />
        </div>
      </div>

      {/* SIMPLE MODE */}
      {state.mode === "simple" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <FieldLabel label="Purchase-side closing costs" />
            <div className="mt-2">
              <NumberInput
                value={state.simple?.purchaseTotal ?? 0}
                onChange={(n) => emit({ ...state, simple: { ...(state.simple ?? { exitTotal: 0, purchaseTotal: 0 }), purchaseTotal: n } })}
                prefix="$"
                min={0}
              />
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <FieldLabel label={state.exitKind === "sale" ? "Sale-side closing costs" : "Refi closing costs"} />
            <div className="mt-2">
              <NumberInput
                value={state.simple?.exitTotal ?? 0}
                onChange={(n) => emit({ ...state, simple: { ...(state.simple ?? { exitTotal: 0, purchaseTotal: 0 }), exitTotal: n } })}
                prefix="$"
                min={0}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* ITEMIZED MODE */}
      {state.mode === "itemized" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Purchase side */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Purchase-side</h3>
              <button onClick={() => addItem("purchase")} className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:opacity-90">
                <Plus size={16} /> Add
              </button>
            </div>
            <TableHeader exitKind={state.exitKind} />
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {(state.purchaseItems ?? []).map((it) => (
                  <motion.div key={it.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <ItemRow
                      item={it}
                      amount={computeItemAmount(it, bases)}
                      onChange={(patch) => updateItem("purchase", it.id, patch)}
                      onRemove={() => removeItem("purchase", it.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <div className="text-sm font-medium text-slate-500">Subtotal</div>
              <div className="text-base font-semibold text-slate-800">{fmtUSD(totals.purchase)}</div>
            </div>
          </div>

          {/* Exit side */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">{state.exitKind === "sale" ? "Sale-side" : "Refi costs"}</h3>
              <button onClick={() => addItem("exit")} className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:opacity-90">
                <Plus size={16} /> Add
              </button>
            </div>
            <TableHeader exitKind={state.exitKind} />
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {(state.exitItems ?? []).map((it) => (
                  <motion.div key={it.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <ItemRow
                      item={it}
                      amount={computeItemAmount(it, bases)}
                      onChange={(patch) => updateItem("exit", it.id, patch)}
                      onRemove={() => removeItem("exit", it.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <div className="text-sm font-medium text-slate-500">Subtotal</div>
              <div className="text-base font-semibold text-slate-800">{fmtUSD(totals.exit)}</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Totals Bar */}
      <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-3">
        <div>
          <div className="text-xs uppercase text-slate-500">Purchase Closing Costs</div>
          <div className="text-lg font-semibold text-slate-800">{fmtUSD(totals.purchase)}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-slate-500">{state.exitKind === "sale" ? "Sale-side Closing Costs" : "Refi Closing Costs"}</div>
          <div className="text-lg font-semibold text-slate-800">{fmtUSD(totals.exit)}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-slate-500">All Closing Costs</div>
          <div className="text-lg font-semibold text-slate-800">{fmtUSD(totals.total)}</div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------
// Optional: lightweight PDF exporter (one-page investor summary)
// Uses dynamic import to avoid bundling unless requested.
// ---------------------------
export async function generateInvestorSummaryPDF(args: {
  fileName?: string;
  header: { address?: string; investor?: string; date?: string };
  snapshot: { purchasePrice: number; rehab: number; arv?: number; loanType?: string; term?: string; totalCashRequired?: number; netProfit?: number; roiPct?: number; monthlyCashflow?: number };
  closingCosts: Totals; // from this component
  financingCosts?: number; // interest + points etc.
  exitSummary?: { scenario: "flip" | "brrrr" | "rental"; salePrice?: number; netProfit?: number; roiPct?: number; dscr?: number };
  stress?: { label: string; value: string }[];
}): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 48;

  // Header
  doc.setFontSize(16).setFont(undefined, "bold").text("Investor Deal Summary", pageW / 2, y, { align: "center" });
  y += 20;
  doc.setFontSize(10).setFont(undefined, "normal");
  if (args.header?.address) doc.text(args.header.address, pageW / 2, y, { align: "center" });
  y += 16;

  // Snapshot box
  const left = 48, right = pageW - 48;
  const boxW = right - left;
  doc.setDrawColor(220).setFillColor(248, 250, 252).rect(left, y, boxW, 90, "F");
  doc.setFontSize(11).setFont(undefined, "bold").text("Quick Snapshot", left + 12, y + 18);
  doc.setFontSize(10).setFont(undefined, "normal");
  const snap = args.snapshot;
  const lines = [
    ["Purchase Price", toUSD(snap.purchasePrice)],
    ["Rehab Budget", toUSD(snap.rehab)],
    ["ARV", snap.arv != null ? toUSD(snap.arv) : "—"],
    ["Loan Type", snap.loanType ?? "—"],
    ["Loan Term", snap.term ?? "—"],
    ["Total Cash Required", snap.totalCashRequired != null ? toUSD(snap.totalCashRequired) : "—"],
    ["Net Profit (Flip)", snap.netProfit != null ? toUSD(snap.netProfit) : "—"],
    ["ROI", snap.roiPct != null ? `${snap.roiPct.toFixed(1)}%` : "—"],
  ];
  const colX = left + 12;
  let rowY = y + 40;
  lines.forEach((row, i) => {
    doc.setFont(undefined, "bold").text(row[0], colX, rowY);
    doc.setFont(undefined, "normal").text(row[1], colX + 180, rowY);
    rowY += 14;
  });
  y += 110;

  // Costs bar
  doc.setFontSize(11).setFont(undefined, "bold").text("Closing & Financing", left, y);
  y += 12;
  doc.setFontSize(10).setFont(undefined, "normal");
  const rows = [
    ["Purchase Closing Costs", toUSD(args.closingCosts.purchase)],
    ["Exit/Refi Closing Costs", toUSD(args.closingCosts.exit)],
    ["Financing Costs", args.financingCosts != null ? toUSD(args.financingCosts) : "—"],
    ["All Closing Costs", toUSD(args.closingCosts.total)],
  ];
  rows.forEach((r) => {
    doc.text(r[0], left, y);
    doc.text(r[1], left + 220, y);
    y += 14;
  });
  y += 8;

  // Exit section
  if (args.exitSummary) {
    doc.setFontSize(11).setFont(undefined, "bold").text("Exit", left, y);
    y += 14;
    const ex = args.exitSummary;
    const exRows: string[][] = [];
    if (ex.scenario === "flip") {
      exRows.push(["Sale Price", toUSD(ex.salePrice ?? 0)]);
      if (ex.netProfit != null) exRows.push(["Net Profit", toUSD(ex.netProfit)]);
      if (ex.roiPct != null) exRows.push(["ROI", `${ex.roiPct.toFixed(1)}%`]);
    } else {
      if (ex.dscr != null) exRows.push(["DSCR", ex.dscr.toFixed(2)]);
    }
    exRows.forEach((r) => {
      doc.setFont(undefined, "bold").text(r[0], left, y);
      doc.setFont(undefined, "normal").text(r[1], left + 220, y);
      y += 14;
    });
  }

  // Stress test
  if (args.stress && args.stress.length) {
    y += 8;
    doc.setFontSize(11).setFont(undefined, "bold").text("Stress Test", left, y);
    y += 14;
    args.stress.forEach((s) => {
      doc.setFont(undefined, "bold").text(s.label, left, y);
      doc.setFont(undefined, "normal").text(s.value, left + 220, y);
      y += 14;
    });
  }

  // Footer
  y = 785;
  doc.setDrawColor(230).line(left, y - 18, right, y - 18);
  doc.setFontSize(9).setTextColor(120).text("Generated by REtotalAI Deal Analyzer — For estimation purposes only.", left, y);

  const blob = doc.output("blob");
  const fileName = args.fileName ?? `Investor_Summary_${new Date().toISOString().slice(0, 10)}.pdf`;
  // Trigger download in browser context if available
  if (typeof window !== "undefined") {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
  return blob;
}

function toUSD(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

