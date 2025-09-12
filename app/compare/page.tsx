"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Metadata } from "next";
import { useCompareSet } from "@/lib/compare/compareStore";
import { CompareToolbar, KpiKey } from "@/components/compare/CompareToolbar";
import { CompareTable, CompareRow } from "@/components/compare/CompareTable";
import { CompareCharts } from "@/components/compare/CompareCharts";
import { CalcPresets } from "@/lib/calc/presets";
import type { CalcBases } from "@/lib/calc/types";
import { compositeScore } from "@/lib/compare/score";

export const metadata: Metadata = {
  title: "Deal Comparison • REtotalAi",
  description: "Compare rental/BRRRR/flip deals with DSCR, Cap, CF, Profit.",
};

export default function ComparePage() {
  const sp = useSearchParams();
  const queryKey = sp.toString();
  const router = useRouter();
  const { ids, add, remove, clear } = useCompareSet();
  const [presetId, setPresetId] = useState(CalcPresets[0].id);
  const [bases, setBases] = useState<CalcBases>(CalcPresets[0].bases);
  const [kpis, setKpis] = useState<KpiKey[]>(["cap","dscr","cf","profit"]);
  const [sortBy, setSortBy] = useState<KpiKey>("cap");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [filters, setFilters] = useState<any>({});
  const [weights, setWeights] = useState({ dscr:40, cap:30, cf:20, profit:10 });
  const [deals, setDeals] = useState<any[]>([]);

  useEffect(()=>{
    const params = new URLSearchParams(queryKey);
    const qIds = (params.get("ids")||"").split(",").filter(Boolean);
    qIds.forEach(add);
    const mode = params.get("mode");
    if(mode) setPresetId(mode);
    const k = params.get("kpis");
    if(k) setKpis(k.split(",") as KpiKey[]);
  },[queryKey, add]);

  useEffect(()=>{
    if(!ids.length){ setDeals([]); return; }
    const ac = new AbortController();
    Promise.all(
      ids.map(id =>
        fetch(`/api/deals/${id}`, { cache: "no-store", signal: ac.signal })
          .then(r => r.json())
          .catch(() => null)
      )
    )
      .then(setDeals)
      .catch(e => { if(e.name !== "AbortError") console.error(e); });
    return () => ac.abort();
  },[ids]);

  const rows: CompareRow[] = useMemo(()=>{
    void presetId; void bases; void kpis;
    const calc = (deal:any): CompareRow => {
      const n = deal.numbers || {};
      const address = deal.property?.address || deal.title || deal.id;
      const purchase = +n.purchasePrice || +n.purchase || 0;
      const rehab = +n.rehabCost || +n.rehab || 0;
      const arv = +n.arv || 0;
      const rent = +n.rent || 0;
      const taxes = +n.taxes || 0;
      const insurance = +n.insurance || 0;
      const hoa = +n.hoa || 0;
      const vacancyPct = +n.vacancyPct || 0;
      const maintenancePct = +n.maintenancePct || 0;
      const managementPct = +n.managementPct || 0;
      const otherMonthly = +n.otherMonthly || 0;
      const downPct = +n.downPct || 0;
      const ratePct = +n.ratePct || 0;
      const termYears = +n.termYears || 0;
      const grossAnnual = rent * 12;
      const vac = grossAnnual * (vacancyPct/100);
      const maint = grossAnnual * (maintenancePct/100);
      const mgmt = grossAnnual * (managementPct/100);
      const opEx = taxes + insurance + hoa*12 + vac + maint + mgmt + otherMonthly*12;
      const noi = grossAnnual - opEx;
      const allIn = purchase + rehab;
      const capRate = allIn>0? noi/allIn: undefined;
      const down = allIn*(downPct/100);
      const loanAmt = Math.max(allIn - down, 0);
      const r = (ratePct/100)/12;
      const nPmts = termYears*12;
      const monthlyPI = (loanAmt>0&&r>0&&nPmts>0)? (loanAmt*r)/(1-Math.pow(1+r,-nPmts)):0;
      const annualDebt = monthlyPI*12;
      const dscr = annualDebt>0? noi/annualDebt: undefined;
      const annualCF = noi - annualDebt;
      const coc = (down+rehab)>0? annualCF/(down+rehab): undefined;
      const grm = grossAnnual>0? allIn/grossAnnual: undefined;
      const grossYield = allIn>0? grossAnnual/allIn: undefined;
      const oer = grossAnnual>0? opEx/grossAnnual: undefined;
      const holdingMonths = +n.holdingMonths || +n.monthsToComplete || 0;
      const sellingPct = (+n.sellingCostPct || 0)+(+n.closingCostPct || 0);
      const carryOtherMonthly = +n.carryOtherMonthly || 0;
      const carrying = (taxes/12 + insurance/12 + hoa + carryOtherMonthly) * holdingMonths;
      const selling = arv*(sellingPct/100);
      const totalInvest = purchase + rehab + carrying + selling;
      const profit = arv - totalInvest;
      const margin = arv>0? profit/arv: undefined;
      const em = totalInvest>0? arv/totalInvest: undefined;
      const flags:string[]=[];
      if(dscr!==undefined && dscr < 1) flags.push("Debt shortfall");
      if(capRate!==undefined && capRate < 0.06) flags.push("Low cap");
      if(annualCF < 0) flags.push("Negative CF");
      if(margin!==undefined && margin < 0.05) flags.push("Thin margin");
      return { id:deal.id, address, strategy:[deal.mode||""], values:{cap:capRate, dscr, cf:annualCF, coc, grm, yield:grossYield, oer, profit, margin, em}, score:0, flags };
    };
    const prelim = deals.filter(Boolean).map(calc);
    const ranges = {
      dscr:[Math.min(...prelim.map(r=>r.values.dscr||0)), Math.max(...prelim.map(r=>r.values.dscr||0))],
      cap:[Math.min(...prelim.map(r=>r.values.cap||0)), Math.max(...prelim.map(r=>r.values.cap||0))],
      cf:[Math.min(...prelim.map(r=>r.values.cf||0)), Math.max(...prelim.map(r=>r.values.cf||0))],
      profit:[Math.min(...prelim.map(r=>r.values.profit||0)), Math.max(...prelim.map(r=>r.values.profit||0))]
    };
    const scored = prelim.map(r=> ({...r, score: compositeScore({dscr:r.values.dscr, capRate:r.values.cap, annualCF:r.values.cf, profit:r.values.profit}, weights, ranges)}));
    return scored.filter(r=> (filters.dscrMin==null || (r.values.dscr??0) >= filters.dscrMin)
                             && (filters.capMin==null || (r.values.cap??0) >= filters.capMin/100)
                             && (filters.cfMin==null || (r.values.cf??0) >= filters.cfMin)
                             && (filters.profitMin==null || (r.values.profit??0) >= filters.profitMin))
                 .sort((a,b)=>{const va=a.values[sortBy]??0; const vb=b.values[sortBy]??0; return sortDir==='asc'? va-vb: vb-va;});
  },[deals, bases, presetId, kpis, filters, sortBy, sortDir, weights]);

  const points = rows.map(r=>({ x:r.values.dscr||0, y:(r.values.cap||0)*100, size:r.values.cf||0, label:r.address.split(',')[0] }));

  const handleShare = ()=>{
    const url = new URL(window.location.href);
    url.searchParams.set('ids', ids.join(','));
    url.searchParams.set('mode', presetId);
    url.searchParams.set('kpis', kpis.join(','));
    router.replace(url.pathname + '?' + url.searchParams.toString());
    navigator.clipboard.writeText(url.toString());
  };

  const handleExport = ()=>{
    const url = `/api/deals/compare/report?ids=${ids.join(',')}&mode=${presetId}&kpis=${kpis.join(',')}`;
    window.open(url, '_blank');
  };

  return (
    <main className="p-4 space-y-4">
      <CompareToolbar
        presetId={presetId}
        bases={bases}
        kpis={kpis}
        sortBy={sortBy}
        sortDir={sortDir}
        filters={filters}
        weights={weights}
        onPreset={setPresetId}
        onBases={setBases}
        onKpis={setKpis}
        onSort={(k,dir)=>{setSortBy(k); setSortDir(dir);}}
        onFilters={setFilters}
        onWeights={setWeights}
        onShare={handleShare}
        onExport={handleExport}
        onClear={clear}
      />
      <CompareTable rows={rows} kpis={kpis} onRemove={remove} />
      {rows.length ? <CompareCharts points={points} /> : null}
    </main>
  );
}
