'use client';
import { useEffect, useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { api } from '@/lib/api';

export default function ShareView({ params }: { params: { token: string } }) {
  const [data, setData] = useState<any>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
        try {
          const res = await api(`/api/share/${params.token}`);
          setData(res);
        } catch {}
    })();
  }, [params.token]);

  async function downloadPdf() {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current);
    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p','pt','a4');
    const width = pdf.internal.pageSize.getWidth();
    const ratio = width / canvas.width;
    pdf.addImage(img, 'PNG', 0, 20, width, canvas.height * ratio);
    pdf.save('retotalai-deal.pdf');
  }

  if (!data) return <div className="p-8">Loading…</div>;
  const d = data.deal ?? {};
  const o = data.outputs ?? {};

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Shared Deal</h1>
        <button onClick={downloadPdf} className="px-3 py-2 rounded-lg border">Download PDF</button>
      </div>
      <div ref={ref} className="rounded-2xl border p-6 space-y-4 bg-white">
        <div>
          <div className="text-lg font-medium">{d.title ?? 'Untitled Deal'}</div>
          <div className="text-sm opacity-70">ARV ${Number(d.arv ?? 0).toLocaleString()} · Purchase ${Number(d.purchasePrice ?? 0).toLocaleString()} · Rehab ${Number(d.rehabCost ?? 0).toLocaleString()}</div>
        </div>
        {o && (
          <div className="grid grid-cols-2 gap-4">
            <Card label="Total Investment" value={o.totalInvestment}/>
            <Card label="Financing Cost" value={o.financingCost}/>
            <Card label="Holding Cost" value={o.holdingCost}/>
            <Card label="Selling Cost" value={o.sellingCost}/>
            <Card label="Profit" value={o.profit}/>
            <Card label="ROI" value={`${(Number(o.roi)*100).toFixed(2)}%`}/>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: any }) {
  const v = typeof value === 'number' ? `$${Number(value).toLocaleString()}` : String(value ?? '—');
  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm opacity-60">{label}</div>
      <div className="text-xl font-semibold">{v}</div>
    </div>
  );
}
