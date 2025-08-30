'use client';
import { useState } from 'react';
import { analyze, DealInputs, DealOutputs } from '@/lib/deal/analyze';

export default function DealAnalyzerPage() {
  const [inputs, setInputs] = useState<DealInputs>({
    purchasePrice: 0,
    rehabCost: 0,
    arv: 0,
    monthsToComplete: 6,
    sellingCostPct: 8,
    loan: { type: 'hard_money', interestRate: 10, pointsPct: 2, ltvPct: 80 },
    holdingMonthly: { taxes: 0, insurance: 0, utilities: 0, hoa: 0, maintenance: 0 }
  });
  const [outputs, setOutputs] = useState<DealOutputs | null>(null);
  const [dealId, setDealId] = useState<string | null>(null);

  const update = (field: keyof DealInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };
  const updateLoan = (field: keyof DealInputs['loan'], value: any) => {
    setInputs(prev => ({ ...prev, loan: { ...prev.loan, [field]: value } }));
  };
  const updateHold = (field: keyof NonNullable<DealInputs['holdingMonthly']>, value: any) => {
    setInputs(prev => ({ ...prev, holdingMonthly: { ...prev.holdingMonthly, [field]: value } }));
  };

  const runAnalysis = async () => {
    if (!dealId) {
      const created = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      }).then(r => r.json());
      setDealId(created.id);
    } else {
      await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      });
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

  const useExample = () => {
    setInputs({
      purchasePrice: 200000,
      rehabCost: 40000,
      arv: 300000,
      monthsToComplete: 6,
      sellingCostPct: 8,
      loan: { type: 'hard_money', interestRate: 10, pointsPct: 2, ltvPct: 80 },
      holdingMonthly: { taxes: 250, insurance: 120, utilities: 90, hoa: 0, maintenance: 100 }
    });
  };

  return (
    <div className="flex p-8 gap-8">
      <div className="w-1/2 space-y-4">
        <h2 className="text-xl font-semibold">Inputs</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Purchase Price" value={inputs.purchasePrice} onChange={v => update('purchasePrice', Math.max(0, v))} />
          <Field label="Rehab Cost" value={inputs.rehabCost} onChange={v => update('rehabCost', Math.max(0, v))} />
          <Field label="After Repair Value" value={inputs.arv} onChange={v => update('arv', Math.max(0, v))} />
          <Field label="Interest Rate (%)" value={inputs.loan.interestRate ?? 0} onChange={v => updateLoan('interestRate', Math.max(0, v))} />
          <div className="flex flex-col">
            <label className="text-sm">Loan Type</label>
            <select
              className="border p-2 rounded"
              value={inputs.loan.type}
              onChange={e => updateLoan('type', e.target.value as DealInputs['loan']['type'])}
            >
              <option value="cash">Cash</option>
              <option value="hard_money">Hard Money</option>
              <option value="conventional">Conventional</option>
              <option value="dscr">DSCR</option>
            </select>
          </div>
          <Field label="Points (%)" value={inputs.loan.pointsPct ?? 0} min={0} max={10} onChange={v => updateLoan('pointsPct', Math.min(10, Math.max(0, v)))} />
          <Field label="LTV (%)" value={inputs.loan.ltvPct ?? 80} onChange={v => updateLoan('ltvPct', Math.max(0, v))} />
          <Field label="Months to Complete" value={inputs.monthsToComplete} min={0} step={1} onChange={v => update('monthsToComplete', Math.max(0, Math.floor(v)))} />
          <Field label="Selling Cost (%)" value={inputs.sellingCostPct ?? 8} min={0} max={15} onChange={v => update('sellingCostPct', Math.min(15, Math.max(0, v)))} />
        </div>
        <div>
          <h3 className="font-medium">Holding Costs (Monthly)</h3>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <Field label="Taxes" value={inputs.holdingMonthly?.taxes ?? 0} onChange={v => updateHold('taxes', Math.max(0, v))} />
            <Field label="Insurance" value={inputs.holdingMonthly?.insurance ?? 0} onChange={v => updateHold('insurance', Math.max(0, v))} />
            <Field label="Utilities" value={inputs.holdingMonthly?.utilities ?? 0} onChange={v => updateHold('utilities', Math.max(0, v))} />
            <Field label="HOA" value={inputs.holdingMonthly?.hoa ?? 0} onChange={v => updateHold('hoa', Math.max(0, v))} />
            <Field label="Maintenance" value={inputs.holdingMonthly?.maintenance ?? 0} onChange={v => updateHold('maintenance', Math.max(0, v))} />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={runAnalysis}>Calculate</button>
          <button className="px-4 py-2 border rounded" onClick={useExample}>Use Example</button>
        </div>
      </div>
      <div className="w-1/2 space-y-4">
        <h2 className="text-xl font-semibold">Results</h2>
        {outputs && (
          <div className="grid grid-cols-2 gap-4">
            <KPI label="Total Investment" value={`$${outputs.totalInvestment.toFixed(2)}`} />
            <KPI label="Financing Cost" value={`$${outputs.financingCost.toFixed(2)}`} />
            <KPI label="Holding Cost" value={`$${outputs.holdingCost.toFixed(2)}`} />
            <KPI label="Selling Cost" value={`$${outputs.sellingCost.toFixed(2)}`} />
            <KPI label="Profit" value={`$${outputs.profit.toFixed(2)}`} />
            <KPI label="ROI" value={`${(outputs.roi * 100).toFixed(2)}%`} />
          </div>
        )}
        {outputs && outputs.warnings.length > 0 && (
          <ul className="text-sm text-yellow-700 list-disc pl-5">
            {outputs.warnings.map(w => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, min = 0, max, step = 0.01 }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex flex-col">
      <label className="text-sm">{label}</label>
      <input
        type="number"
        className="border p-2 rounded"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
      />
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
