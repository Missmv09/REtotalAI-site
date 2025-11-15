"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Mode = "quick" | "detailed";

type Scope =
  | "paint-interior"
  | "flooring-lvp"
  | "flooring-carpet"
  | "tile-floor"
  | "countertop"
  | "roof"
  | "windows"
  | "baseboards";

const ALL_SCOPES: Scope[] = [
  "paint-interior",
  "flooring-lvp",
  "flooring-carpet",
  "tile-floor",
  "countertop",
  "roof",
  "windows",
  "baseboards",
];

type LineItem = {
  type: "labor" | "material" | string;
  name: string;
  sku?: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
};

type EstimateResult = {
  materialTotal?: number;
  laborTotal?: number;
  subtotal?: number;
  contingency?: number;
  tax?: number;
  grandTotal?: number;
  lineItems?: LineItem[];
};

function formatCurrency(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `$${value.toFixed(2)}`;
}

export default function RenovationEstimatorPage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("propertyId") ?? "";

  const [mode, setMode] = useState<Mode>("quick");
  const [totalSqft, setTotalSqft] = useState<number>(1500);
  const [scopes, setScopes] = useState<Scope[]>(["paint-interior", "flooring-lvp"]);
  const [taxPct, setTaxPct] = useState(0.0875);
  const [contingencyPct, setContingencyPct] = useState(0.1);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const toggleScope = (scope: Scope) => {
    setScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]));
  };

  const estimate = async () => {
    setLoading(true);
    setApiError(null);

    try {
      const res = await fetch("/api/renovations/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: propertyId || undefined,
          mode,
          totalSqft,
          scopes,
          taxPct,
          contingencyPct,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data: EstimateResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setApiError(err?.message ?? "Failed to fetch estimate");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Renovation Estimator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="estimator-mode">Quick Mode</Label>
            <Switch
              id="estimator-mode"
              checked={mode === "quick"}
              onCheckedChange={(v) => setMode(v ? "quick" : "detailed")}
            />
          </div>

          {mode === "quick" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimator-total-sqft">Total (affected) sqft</Label>
                <Input
                  id="estimator-total-sqft"
                  type="number"
                  value={totalSqft}
                  onChange={(e) => setTotalSqft(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="estimator-tax">Tax % (e.g. 0.0875)</Label>
                <Input
                  id="estimator-tax"
                  type="number"
                  step="0.0001"
                  value={taxPct}
                  onChange={(e) => setTaxPct(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="estimator-contingency">Contingency % (e.g. 0.10)</Label>
                <Input
                  id="estimator-contingency"
                  type="number"
                  step="0.01"
                  value={contingencyPct}
                  onChange={(e) => setContingencyPct(Number(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ALL_SCOPES.map((scope) => {
              const checked = scopes.includes(scope);
              return (
                <label
                  key={scope}
                  className={`border rounded-2xl px-4 py-2 cursor-pointer text-sm ${checked ? "ring-2 ring-black" : ""}`}
                >
                  <input
                    className="hidden"
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleScope(scope)}
                  />
                  {scope}
                </label>
              );
            })}
          </div>

          <Button onClick={estimate} disabled={loading}>
            {loading ? "Estimating…" : "Estimate"}
          </Button>

          {apiError && <p className="text-sm text-red-500">{apiError}</p>}
        </CardContent>
      </Card>

      {result && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Estimate Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Materials:</div>
              <div>{formatCurrency(result.materialTotal)}</div>
              <div>Labor:</div>
              <div>{formatCurrency(result.laborTotal)}</div>
              <div>Subtotal:</div>
              <div>{formatCurrency(result.subtotal)}</div>
              <div>Contingency:</div>
              <div>{formatCurrency(result.contingency)}</div>
              <div>Tax:</div>
              <div>{formatCurrency(result.tax)}</div>
              <div className="font-semibold">Grand Total:</div>
              <div className="font-semibold">{formatCurrency(result.grandTotal)}</div>
            </div>

            {!!result.lineItems?.length && (
              <div className="mt-4 space-y-1">
                <h4 className="font-semibold">Line Items</h4>
                <ul className="text-xs space-y-1 max-h-64 overflow-auto">
                  {result.lineItems.map((item, index) => (
                    <li key={`${item.name}-${index}`} className="flex justify-between border-b py-1">
                      <span>
                        {item.type === "labor" ? "🛠️" : "📦"} {item.name}
                        {item.sku ? ` (${item.sku})` : ""} — {item.qty} {item.unit} × ${item.unitPrice}
                      </span>
                      <span>${item.total}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

