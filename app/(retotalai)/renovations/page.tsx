'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ALL_SCOPES = [
  'paint-interior',
  'flooring-lvp',
  'flooring-carpet',
  'tile-floor',
  'countertop',
  'roof',
  'windows',
  'baseboards',
] as const

type Scope = (typeof ALL_SCOPES)[number]
type Mode = 'quick' | 'detailed'

export default function RenovationEstimatorPage() {
  const [mode, setMode] = useState<Mode>('quick')
  const [totalSqft, setTotalSqft] = useState<number>(1500)
  const [scopes, setScopes] = useState<Scope[]>([
    'paint-interior',
    'flooring-lvp',
  ])
  const [taxPct, setTaxPct] = useState(0.0875)
  const [contingencyPct, setContingencyPct] = useState(0.1)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const toggleScope = (scope: Scope) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  const estimate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/renovations/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: 'temp',
          mode,
          totalSqft,
          scopes,
          taxPct,
          contingencyPct,
        }),
      })
      const data = await res.json()
      setResult(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Renovation Estimator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Quick Mode</Label>
            <Switch
              checked={mode === 'quick'}
              onCheckedChange={(v) => setMode(v ? 'quick' : 'detailed')}
            />
          </div>

          {mode === 'quick' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total (affected) sqft</Label>
                <Input
                  type="number"
                  value={totalSqft}
                  onChange={(e) =>
                    setTotalSqft(Number(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label>Tax % (e.g. 0.0875)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={taxPct}
                  onChange={(e) => setTaxPct(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Contingency % (e.g. 0.10)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={contingencyPct}
                  onChange={(e) =>
                    setContingencyPct(Number(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ALL_SCOPES.map((s) => (
              <label
                key={s}
                className={`border rounded-2xl px-4 py-2 cursor-pointer text-sm ${
                  scopes.includes(s) ? 'ring-2 ring-black' : ''
                }`}
              >
                <input
                  className="hidden"
                  type="checkbox"
                  checked={scopes.includes(s)}
                  onChange={() => toggleScope(s)}
                />
                {s}
              </label>
            ))}
          </div>

          <Button onClick={estimate} disabled={loading}>
            {loading ? 'Estimating…' : 'Estimate'}
          </Button>
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
              <div>${result.materialTotal?.toFixed?.(2)}</div>
              <div>Labor:</div>
              <div>${result.laborTotal?.toFixed?.(2)}</div>
              <div>Subtotal:</div>
              <div>${result.subtotal?.toFixed?.(2)}</div>
              <div>Contingency:</div>
              <div>${result.contingency?.toFixed?.(2)}</div>
              <div>Tax:</div>
              <div>${result.tax?.toFixed?.(2)}</div>
              <div className="font-semibold">Grand Total:</div>
              <div className="font-semibold">
                ${result.grandTotal?.toFixed?.(2)}
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <h4 className="font-semibold">Line Items</h4>
              <ul className="text-xs space-y-1 max-h-64 overflow-auto">
                {result.lineItems?.map((li: any, i: number) => (
                  <li
                    key={i}
                    className="flex justify-between border-b py-1"
                  >
                    <span>
                      {li.type === 'labor' ? '🛠️' : '📦'} {li.name}
                      {li.sku ? ` (${li.sku})` : ''} — {li.qty} {li.unit} × $
                      {li.unitPrice}
                    </span>
                    <span>${li.total}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
