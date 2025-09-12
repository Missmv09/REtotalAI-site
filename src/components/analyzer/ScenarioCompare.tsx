"use client";
import * as React from "react";

export interface ScenarioCard {
  title: string;
  items: { label: string; value: string }[];
}

export function ScenarioCompare({ scenarios }: { scenarios: ScenarioCard[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {scenarios.map((s, i) => (
        <div key={i} className="rounded-xl border p-3">
          <div className="text-sm font-semibold mb-2">{s.title}</div>
          <ul className="space-y-1">
            {s.items.map((it, j) => (
              <li key={j} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{it.label}</span>
                <span className="font-medium">{it.value}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
