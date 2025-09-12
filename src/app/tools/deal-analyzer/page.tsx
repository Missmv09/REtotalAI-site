'use client';
import React, { useState } from 'react';
import { DealInput, CalcBases } from '@/lib/calc/types';
import { CalcPresets } from '@/lib/calc/presets';
import { rentalKPIs } from '@/lib/calc/formulas';
import { CalcModeToggle } from '@/components/analyzer/CalcModeToggle';
import { CalcBasesAdvanced } from '@/components/analyzer/CalcBasesAdvanced';
import { ExplainableStat } from '@/components/analyzer/ExplainableStat';
import { ScenarioCompare } from '@/components/analyzer/ScenarioCompare';
import { SensitivityTornado } from '@/components/analyzer/SensitivityTornado';
import { StickyActionBar } from '@/components/analyzer/StickyActionBar';

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
  const [mode, setMode] = useState<keyof typeof presetMap>('Conservative');
  const [bases, setBases] = useState<CalcBases>(CalcPresets.find(p=>p.id==='Conservative')!.bases);
  const [input, setInput] = useState<DealInput>(defaultInput);
  const kpis = rentalKPIs(input, bases);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <CalcModeToggle value={mode as any} onChange={(id,b)=>{setMode(id as any); setBases(b);}} />
        <CalcBasesAdvanced bases={bases} onChange={setBases} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <ExplainableStat label="Cap Rate" value={(kpis.capRate*100).toFixed(2)+"%"} onExplain={()=>alert(kpis.explain.NOI)} />
        <ExplainableStat label="DSCR" value={kpis.dscr.toFixed(2)} onExplain={()=>alert(kpis.explain.PMT)} />
        <ExplainableStat label="Annual CF" value={kpis.annualCF.toFixed(0)} onExplain={()=>alert(kpis.explain.GAR)} />
      </div>

      <ScenarioCompare input={input} bases={bases} />
      <SensitivityTornado input={input} bases={bases} metric="annualCF" />

      <StickyActionBar>
        <button type="button" className="btn btn-primary min-w-40">Generate Report</button>
      </StickyActionBar>
    </div>
  );
}

const presetMap = {
  Conservative: true,
  Lender: true,
  Broker: true,
  DealCheck: true,
  Custom: true
};
