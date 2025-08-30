'use client';
import { useState } from 'react';
import { analyze, DealInputs, DealOutputs } from '@/lib/deal/analyze';

export default function DealAnalyzerPage() {
  const [inputs, setInputs] = useState<DealInputs>({
    purchasePrice: 0,
    rehabCost: 0,
    arv: 0,
    loanAmount: 0,
    interestRate: 0.08,
    monthlyIncome: 0,
    holdingMonths: 6
  });
  const [outputs, setOutputs] = useState<DealOutputs | null>(null);
  const [dealId, setDealId] = useState<string | null>(null);

  const runAnalysis = async () => {
    if (!dealId) {
      const created = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      }).then(r => r.json());
      setDealId(created.id);
    }
    const local = analyze(inputs);
    setOutputs(local);
    if (dealId) {
      await fetch(`/api/deals/${dealId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      });
    }
  };

  const update = (field: keyof DealInputs, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex p-8 gap-8">
      <div className="w-1/2 space-y-4">
        <h2 className="text-xl font-semibold">Inputs</h2>
        {([
          ['purchasePrice', 'Purchase Price'],
          ['rehabCost', 'Rehab Cost'],
          ['arv', 'After Repair Value'],
          ['loanAmount', 'Loan Amount'],
          ['interestRate', 'Interest Rate'],
          ['monthlyIncome', 'Monthly Income'],
          ['holdingMonths', 'Holding Months']
        ] as [keyof DealInputs, string][]).map(([key, label]) => (
          <div key={key} className="flex flex-col">
            <label className="text-sm">{label}</label>
            <input
              type="number"
              className="border p-2 rounded"
              value={inputs[key]}
              onChange={e => update(key, Number(e.target.value))}
            />
          </div>
        ))}
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={runAnalysis}
        >
          Run Analysis
        </button>
      </div>
      <div className="w-1/2 space-y-4">
        <h2 className="text-xl font-semibold">Results</h2>
        {outputs && (
          <div className="grid grid-cols-2 gap-4">
            <KPI label="Profit" value={`$${outputs.profit.toFixed(2)}`} />
            <KPI label="ROI" value={`${(outputs.roi * 100).toFixed(2)}%`} />
            <KPI label="Cash Needed" value={`$${outputs.cashNeeded.toFixed(2)}`} />
            <KPI label="DSCR" value={outputs.dscr.toFixed(2)} />
          </div>
        )}
        {outputs && outputs.warnings.length > 0 && (
          <ul className="text-sm text-yellow-700 list-disc pl-5">
            {outputs.warnings.map(w => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
        <div className="pt-4">
          <button className="px-3 py-1 border rounded mr-2" disabled>
            Export PDF
          </button>
          <button className="px-3 py-1 border rounded mr-2" disabled>
            Export CSV
          </button>
          <button className="px-3 py-1 border rounded" disabled>
            Share Link
          </button>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 border rounded bg-white">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
