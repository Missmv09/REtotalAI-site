"use client";
import * as React from "react";
import { CalcPresets } from "@/lib/calc/presets";
import type { CalcModePreset, CalcBases } from "@/lib/calc/types";
import { CalcBasesAdvanced } from "@/components/analyzer/CalcBasesAdvanced";

const KPI_CHOICES = [
  { key: "cap", label: "Cap %" },
  { key: "dscr", label: "DSCR" },
  { key: "cf", label: "Annual CF" },
  { key: "coc", label: "CoC %" },
  { key: "grm", label: "GRM" },
  { key: "yield", label: "Gross Yield %" },
  { key: "oer", label: "OER %" },
  { key: "profit", label: "Flip Profit" },
  { key: "margin", label: "Margin %" },
  { key: "em", label: "Equity Multiple" },
] as const;

export type KpiKey = typeof KPI_CHOICES[number]["key"];

export function CompareToolbar(props: {
  presetId: CalcModePreset["id"];
  bases: CalcBases;
  kpis: KpiKey[];
  sortBy: KpiKey;
  sortDir: "asc"|"desc";
  filters: { dscrMin?: number; capMin?: number; cfMin?: number; profitMin?: number };
  weights: { dscr: number; cap: number; cf: number; profit: number };
  onPreset:(id: CalcModePreset["id"])=>void;
  onBases:(b: CalcBases)=>void;
  onKpis:(k: KpiKey[])=>void;
  onSort:(key:KpiKey, dir:"asc"|"desc")=>void;
  onFilters:(f: any)=>void;
  onWeights:(w: any)=>void;
  onShare:()=>void;
  onExport:()=>void;
  onClear:()=>void;
}) {
  const toggle = (k:KpiKey)=> props.onKpis(props.kpis.includes(k)? props.kpis.filter(x=>x!==k): [...props.kpis,k]);
  return (
    <div className="rounded-xl border p-3 grid grid-cols-1 gap-3">
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium">Underwriting preset</label>
          <select className="w-full rounded border px-2 py-2 mt-1"
            value={props.presetId}
            onChange={(e)=>props.onPreset(e.target.value as any)}>
            {CalcPresets.map(p=> <option key={p.id} value={p.id}>{p.id}</option>)}
            <option value="Custom">Custom</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Controls loan basis, % basis, cap/GRM basis, invested basis.</p>
        </div>
        <div>
          <label className="text-sm font-medium">Sort by</label>
          <div className="flex gap-2 mt-1">
            <select className="rounded border px-2 py-2"
              value={props.sortBy}
              onChange={(e)=>props.onSort(e.target.value as any, props.sortDir)}>
              {KPI_CHOICES.map(c=> <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <select className="rounded border px-2 py-2"
              value={props.sortDir}
              onChange={(e)=>props.onSort(props.sortBy, e.target.value as "asc"|"desc")}>
              <option value="desc">Desc</option><option value="asc">Asc</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Filters</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <input className="rounded border px-2 py-1" placeholder="DSCR ≥" type="number" step="0.01"
              value={props.filters.dscrMin ?? ""} onChange={(e)=>props.onFilters({...props.filters, dscrMin: e.target.value? +e.target.value: undefined})}/>
            <input className="rounded border px-2 py-1" placeholder="Cap% ≥" type="number" step="0.1"
              value={props.filters.capMin ?? ""} onChange={(e)=>props.onFilters({...props.filters, capMin: e.target.value? +e.target.value: undefined})}/>
            <input className="rounded border px-2 py-1" placeholder="CF ≥" type="number" step="100"
              value={props.filters.cfMin ?? ""} onChange={(e)=>props.onFilters({...props.filters, cfMin: e.target.value? +e.target.value: undefined})}/>
            <input className="rounded border px-2 py-1" placeholder="Profit ≥" type="number" step="100"
              value={props.filters.profitMin ?? ""} onChange={(e)=>props.onFilters({...props.filters, profitMin: e.target.value? +e.target.value: undefined})}/>
          </div>
        </div>
      </div>

      <details className="rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-medium">Advanced math options</summary>
        <div className="mt-3">
          <CalcBasesAdvanced value={props.bases} onChange={(b)=>props.onBases(b)} />
        </div>
      </details>

      <div>
        <div className="text-sm font-medium">KPIs to show</div>
        <div className="flex flex-wrap gap-3 mt-1">
          {KPI_CHOICES.map(c=>(
            <label key={c.key} className="inline-flex items-center gap-1 text-sm">
              <input type="checkbox" checked={props.kpis.includes(c.key)} onChange={()=>toggle(c.key)}/>
              {c.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
        <button className="btn btn-outline" onClick={props.onShare}>Copy share link</button>
        <button className="btn btn-outline" onClick={props.onExport}>Export PDF</button>
        <button className="btn" onClick={props.onClear}>Clear</button>
      </div>
    </div>
  );
}
