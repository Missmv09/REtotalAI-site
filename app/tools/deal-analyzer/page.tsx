'use client';
import { useState, useRef, FormEvent } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { analyze, DealInputs } from '@/lib/deal/analyze';
import { api } from '@/lib/api';

const money = (n: number) => `$${Number(n || 0).toLocaleString()}`;

export default function DealAnalyzerPage() {
  const [mode] = useState<'flip'|'buyhold'|'brrrr'>('flip'); // tabs can be added
  const [state, setState] = useState<DealInputs>({
    mode: 'flip',
    purchasePrice: 350000,
    rehabCost: 25000,
    arv: 420000,
    monthsToComplete: 6,
    loan: { type: 'hard_money', interestRate: 12, pointsPct: 2, ltvPct: 80, termMonths: 12 },
    holdingMonthly: { taxes: 250, insurance: 120, utilities: 90, hoa: 0, maintenance: 100 },
    selling: { agentCommissionPct: 5.0, titleEscrow: 2000, transferTaxesRecording: 1200, attorney: 750, marketing: 500, sellerMoving: 400, other: 0 }
  });
  const [out, setOut] = useState<any>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  function upd<K extends keyof DealInputs>(k: K, v: DealInputs[K]) { setState(s => ({ ...s, [k]: v })); }
  function updLoan(k: keyof DealInputs['loan'], v: any) { setState(s => ({ ...s, loan: { ...s.loan, [k]: v }})); }
  function updHold(k: keyof NonNullable<DealInputs['holdingMonthly']>, v: any) {
    setState(s => ({ ...s, holdingMonthly: { ...(s.holdingMonthly || {}), [k]: v }}));
  }
  function updSell(k: keyof NonNullable<DealInputs['selling']>, v: any) {
    setState(s => ({ ...s, selling: { ...(s.selling || {}), [k]: v }}));
  }

  function calc() { setOut(analyze(state)); }

  async function saveAndShare() {
      // 1) Create a deal
      const { id } = await api('/api/deals', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Analysis',
          purchasePrice: state.purchasePrice,
          rehabCost: state.rehabCost,
          arv: state.arv
        })
      });

      // 2) Save run snapshot via analyze API
      const outputs = await api(`/api/deals/${id}/analyze`, {
        method: 'POST',
        body: JSON.stringify(state)
      });
      setOut(outputs);

      // 3) Create/reuse share link
      const { url } = await api(`/api/deals/${id}/share`, { method: 'POST' });
      setShareUrl(url);
  }

  async function downloadPdf() {
    if (!pdfRef.current) return;
    const canvas = await html2canvas(pdfRef.current);
    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p','pt','a4');
    const width = pdf.internal.pageSize.getWidth();
    const ratio = width / canvas.width;
    pdf.addImage(img, 'PNG', 0, 20, width, canvas.height * ratio);
    pdf.save('retotalai-deal.pdf');
  }

  function previewPdf() {
    downloadPdf();
  }

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    calc();
    await saveAndShare();
  }

  return (
    <form onSubmit={handleGenerate} className="min-h-[100dvh] flex flex-col">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-28 flex-1">
        <h1 className="text-2xl font-semibold mb-4">Deal Analyzer — {mode === 'flip' ? 'Fix & Flip' : mode}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT: Inputs */}
          <div className="space-y-4">
          <Section title="Property & Purchase">
            <Row label="Purchase Price"><Input num value={state.purchasePrice} onChange={v=>upd('purchasePrice', v)} /></Row>
            <Row label="Rehab / Repair Cost"><Input num value={state.rehabCost} onChange={v=>upd('rehabCost', v)} /></Row>
            <Row label="After Repair Value (ARV)"><Input num value={state.arv} onChange={v=>upd('arv', v)} /></Row>
          </Section>

          <Section title="Loan">
            <Row label="Loan Type">
              <select className="input" value={state.loan.type} onChange={e=>updLoan('type', e.target.value)}>
                <option value="cash">Cash</option>
                <option value="hard_money">Hard Money</option>
                <option value="conventional">Conventional</option>
                <option value="dscr">DSCR</option>
              </select>
            </Row>
            <Row label="Interest Rate (%)"><Input num value={state.loan.interestRate} onChange={v=>updLoan('interestRate', v)} /></Row>
            <Row label="Points (%)"><Input num value={state.loan.pointsPct} onChange={v=>updLoan('pointsPct', v)} /></Row>
            <Row label="LTV (%)"><Input num value={state.loan.ltvPct} onChange={v=>updLoan('ltvPct', v)} /></Row>
            <Row label="Holding Period / Term (months)"><Input num value={state.loan.termMonths ?? state.monthsToComplete} onChange={v=>{updLoan('termMonths', v); upd('monthsToComplete', v);}}/></Row>
            <Row label="(Optional) Term (years)"><Input num value={state.loan.termYears} onChange={v=>updLoan('termYears', v)} /></Row>
          </Section>

          <Section title="Monthly Holding Costs (during rehab/hold)">
            <Row label="Taxes"><Input num value={state.holdingMonthly?.taxes} onChange={v=>updHold('taxes', v)} /></Row>
            <Row label="Insurance"><Input num value={state.holdingMonthly?.insurance} onChange={v=>updHold('insurance', v)} /></Row>
            <Row label="Utilities"><Input num value={state.holdingMonthly?.utilities} onChange={v=>updHold('utilities', v)} /></Row>
            <Row label="HOA"><Input num value={state.holdingMonthly?.hoa} onChange={v=>updHold('hoa', v)} /></Row>
            <Row label="Maintenance"><Input num value={state.holdingMonthly?.maintenance} onChange={v=>updHold('maintenance', v)} /></Row>
            <Row label="Holding Period (months)"><Input num value={state.monthsToComplete} onChange={v=>upd('monthsToComplete', v)} /></Row>
          </Section>

          <Section title="Selling Costs (breakdown)">
            <Row label="Agent Commission (%)"><Input num value={state.selling?.agentCommissionPct} onChange={v=>updSell('agentCommissionPct', v)} /></Row>
            <Row label="Title/Escrow"><Input num value={state.selling?.titleEscrow} onChange={v=>updSell('titleEscrow', v)} /></Row>
            <Row label="Transfer Taxes & Recording"><Input num value={state.selling?.transferTaxesRecording} onChange={v=>updSell('transferTaxesRecording', v)} /></Row>
            <Row label="Attorney"><Input num value={state.selling?.attorney} onChange={v=>updSell('attorney', v)} /></Row>
            <Row label="Pre-sale & Marketing"><Input num value={state.selling?.marketing} onChange={v=>updSell('marketing', v)} /></Row>
            <Row label="Seller Moving"><Input num value={state.selling?.sellerMoving} onChange={v=>updSell('sellerMoving', v)} /></Row>
            <Row label="Other"><Input num value={state.selling?.other} onChange={v=>updSell('other', v)} /></Row>
          </Section>
          {shareUrl && <div className="text-sm mt-4">Share URL: <a className="text-blue-600 underline" href={shareUrl} target="_blank">{shareUrl}</a></div>}
        </div>

        {/* RIGHT: Outputs */}
        <div ref={pdfRef} className="space-y-4">
          <KPI title="Total Investment" value={out?.totalInvestment}/>
          <KPI title="Financing Cost" value={out?.financingCost}/>
          <KPI title="Holding Cost" value={out?.holdingCost}/>
          <KPI title="Selling Cost" value={out?.sellingCost}/>
          <KPI title="Profit" value={out?.profit}/>
          <KPI title="ROI" value={out ? `${(out.roi*100).toFixed(2)}%` : undefined}/>
          {out?.warnings?.length ? (
            <div className="rounded-xl border p-4">
              <div className="font-medium mb-2">Warnings</div>
              <ul className="list-disc pl-5 text-sm">
                {out.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
      </div>
      <div
        className="sticky bottom-0 z-40 border-t bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap gap-3 justify-end">
          <button type="button" className="btn btn-outline" onClick={previewPdf}>Preview PDF</button>
          <button type="submit" className="btn btn-primary min-w-40">Generate Report</button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, children }: any) {
  return <div className="rounded-2xl border p-4"><div className="font-medium mb-3">{title}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div></div>;
}
function Row({ label, children }: any) {
  return <label className="text-sm space-y-1"><div className="opacity-70">{label}</div>{children}</label>;
}
function Input({ value, onChange, num=false }: { value?: any; onChange: (v:any)=>void; num?: boolean }) {
  return <input className="input w-full border rounded-lg px-3 py-2" value={value ?? ''} onChange={e=>onChange(num ? Number(e.target.value || 0) : e.target.value)} type={num ? 'number' : 'text'} />;
}
function KPI({ title, value }: { title: string; value?: number|string }) {
  const v = typeof value === 'number' ? money(value) : (value ?? '—');
  return <div className="rounded-2xl border p-4 bg-white"><div className="text-sm opacity-60">{title}</div><div className="text-2xl font-semibold">{v}</div></div>;
}
