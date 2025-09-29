'use client';
import React, { useMemo, useState } from 'react';
import { DealInput } from '@/lib/calc/types';
import { CalcPresets } from '@/lib/calc/presets';
import { rentalKPIs, flipKPIs } from '@/lib/calc/formulas';
import { CalcModeToggle, CalcModeId } from '@/components/analyzer/CalcModeToggle';
import { CalcBasesAdvanced, Bases } from '@/components/analyzer/CalcBasesAdvanced';
import { ExplainableStat } from '@/components/analyzer/ExplainableStat';
import { ScenarioCompare } from '@/components/analyzer/ScenarioCompare';
import { SensitivityTornado } from '@/components/analyzer/SensitivityTornado';
import { StickyActionBar } from '@/components/analyzer/StickyActionBar';
import ClosingCostsSection, {
  type ClosingCostBases,
  type ClosingCostItem,
} from '@/components/ClosingCostsSection';

const defaultInput: DealInput = {
  purchase: 180000,
  arv: 220000,
  rehab: 15000,
  rent: 1950,
  taxes: 3600,
  insurance: 1200,
  hoaMonthly: 0,
  otherMonthly: 50,
  vacancyPct: 5,
  managementPct: 8,
  maintenancePct: 5,
  downPct: 20,
  ratePct: 7,
  termYears: 30,
  holdingMonths: 6,
  sellingCostPct: 8,
  closingCostPct: 2,
  carryOtherMonthly: 200
};

export default function DealAnalyzerPage() {
  const [mode, setMode] = useState<CalcModeId>('Conservative');
  const [bases, setBases] = useState<Bases>(CalcPresets.find(p=>p.id==='Conservative')!.bases);
  const [input] = useState<DealInput>(defaultInput);
  const [closingCostsItems, setClosingCostsItems] = useState<ClosingCostItem[]>([
    { id: 'cc-1', name: 'Closing Costs', type: 'percent', basis: 'purchase_price', value: 3 },
    { id: 'cc-2', name: 'Loan Origination', type: 'percent', basis: 'loan_amount', value: 1 },
  ]);
  const [closingCostsTotal, setClosingCostsTotal] = useState(0);
  const [exitMode] = useState<'sale' | 'refi'>('sale');

  const dealInput = useMemo<DealInput>(() => ({
    ...input,
    closingCosts: closingCostsTotal,
  }), [input, closingCostsTotal]);

  const kpis = rentalKPIs(dealInput, bases);
  const note = CalcPresets.find(p=>p.id===mode)?.notes?.[0];

  const hold = rentalKPIs(dealInput, bases);
  const brrrr = rentalKPIs(dealInput, bases);
  const flip = flipKPIs(dealInput);

  const purchasePrice = dealInput.purchase ?? 0;
  const salePrice = dealInput.arv ?? 0;
  const loanAmount = kpis.loanAmount;
  const refiLoanAmount = exitMode === 'refi' ? kpis.loanAmount : undefined;

  const closingBases: ClosingCostBases = useMemo(() => ({
    loan_amount: loanAmount,
    purchase_price: purchasePrice,
    sale_price: exitMode === 'sale' ? salePrice : undefined,
    refi_loan: exitMode === 'refi' ? refiLoanAmount : undefined,
  }), [loanAmount, purchasePrice, salePrice, exitMode, refiLoanAmount]);
  const scenarios = [
    { title: 'Hold', items: [
      { label: 'Cap', value: hold.capRate.toFixed(3) },
      { label: 'DSCR', value: hold.dscr.toFixed(2) },
      { label: 'CF', value: hold.annualCF.toFixed(0) }
    ]},
    { title: 'BRRRR', items: [
      { label: 'Cap', value: brrrr.capRate.toFixed(3) },
      { label: 'DSCR', value: brrrr.dscr.toFixed(2) },
      { label: 'CF', value: brrrr.annualCF.toFixed(0) }
    ]},
    { title: 'Flip', items: [
      { label: 'Profit', value: flip.profit.toFixed(0) },
      { label: 'Margin', value: (flip.margin*100).toFixed(2)+'%' }
    ]}
  ];

  return (
    <div className="p-4 space-y-4">
      <CalcModeToggle
        value={mode}
        onChange={(id) => {
          setMode(id);
          const preset = CalcPresets.find(p=>p.id===id);
          if (preset) setBases(preset.bases);
        }}
        note={note}
      />

      <CalcBasesAdvanced value={bases} onChange={setBases} />

      <ClosingCostsSection
        title="Closing Costs"
        exitKind={exitMode === 'refi' ? 'refi' : 'sale'}
        bases={closingBases}
        value={closingCostsItems}
        onChange={(items, total) => {
          setClosingCostsItems(items);
          setClosingCostsTotal(total);
        }}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <ExplainableStat label="Cap Rate" value={(kpis.capRate*100).toFixed(2)+"%"} onExplain={()=>alert(kpis.explain.NOI)} />
        <ExplainableStat label="DSCR" value={kpis.dscr.toFixed(2)} onExplain={()=>alert(kpis.explain.PMT)} />
        <ExplainableStat label="Annual CF" value={kpis.annualCF.toFixed(0)} onExplain={()=>alert(kpis.explain.GAR)} />
      </div>

      <ScenarioCompare scenarios={scenarios} />
      <SensitivityTornado input={dealInput} bases={bases} metric="annualCF" />

      <StickyActionBar>
        <button type="button" className="btn btn-primary min-w-40">Generate Report</button>
      </StickyActionBar>
    </div>
  );
}
