"use client";
import * as React from "react";

export function CompareCharts({ points }:{ points:{ x:number; y:number; size:number; label:string }[] }) {
  const w = 600, h = 240, pad = 30;
  const xs = points.map(p=>p.x), ys = points.map(p=>p.y);
  const min = (a:number[])=>Math.min(...a), max=(a:number[])=>Math.max(...a);
  const xMin=min(xs), xMax=max(xs), yMin=min(ys), yMax=max(ys);
  const xScale=(v:number)=> pad + (w-2*pad) * (v-xMin)/(xMax-xMin || 1);
  const yScale=(v:number)=> h-pad - (h-2*pad) * (v-yMin)/(yMax-yMin || 1);
  return (
    <div className="rounded-xl border p-3 overflow-x-auto">
      <div className="text-sm font-medium mb-2">Cap vs DSCR (bubble size = Annual CF)</div>
      <svg width={w} height={h}>
        <line x1={pad} y1={h-pad} x2={w-pad} y2={h-pad} stroke="#CBD5E1"/>
        <line x1={pad} y1={pad} x2={pad} y2={h-pad} stroke="#CBD5E1"/>
        {points.map((p,i)=>(
          <g key={i}>
            <circle cx={xScale(p.x)} cy={yScale(p.y)} r={Math.max(3, Math.sqrt(Math.abs(p.size))/60)} fill="#94A3B8"/>
            <text x={xScale(p.x)+6} y={yScale(p.y)} fontSize="10">{p.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
