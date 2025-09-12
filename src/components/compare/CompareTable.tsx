"use client";
import * as React from "react";
import type { KpiKey } from "./CompareToolbar";

export interface CompareRow {
  id: string;
  address: string;
  strategy: string[];
  values: Record<KpiKey, number|undefined>;
  score: number;
  flags: string[];
}

export function CompareTable({ rows, kpis, onRemove }:{
  rows: CompareRow[];
  kpis: KpiKey[];
  onRemove:(id:string)=>void;
}) {
  const fmt$ = (n:number|undefined)=> n===undefined || isNaN(n as any) ? "—" : (Math.abs(n as number)>=1000? `$${Math.round(n as number).toLocaleString()}`: `$${Math.round(n as number)}`);
  const fmtPct = (n:number|undefined)=> n===undefined || isNaN(n as any) ? "—" : `${(n as number).toFixed(2)}%`;
  const fmt = (key:KpiKey, v:number|undefined)=>{
    if (key==="cap"||key==="coc"||key==="yield"||key==="oer"||key==="margin") return fmtPct((v??0)* (key==="margin"?100:100));
    if (key==="dscr"||key==="grm"||key==="em") return v===undefined? "—" : (key==="em"? `${(v).toFixed(3)}×` : (v as number).toFixed(2));
    return fmt$(v);
  };
  return (
    <div className="rounded-xl border overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-2 text-left">Property</th>
            {kpis.map(k=> <th key={k} className="p-2 text-right">{k.toUpperCase()}</th>)}
            <th className="p-2 text-right">Score</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.id} className="border-t">
              <td className="p-2">
                <div className="font-medium">{r.address}</div>
                <div className="text-xs text-gray-500">{r.strategy.join(" • ")}</div>
                {r.flags.length? <div className="text-xs text-red-600 mt-1">{r.flags.join(" | ")}</div>: null}
              </td>
              {kpis.map(k=> <td key={k} className="p-2 text-right">{fmt(k, r.values[k])}</td>)}
              <td className="p-2 text-right">{(r.score*100).toFixed(0)}</td>
              <td className="p-2 text-right">
                <button className="text-xs underline" onClick={()=>onRemove(r.id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
