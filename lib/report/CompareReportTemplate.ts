// @server-only
/* eslint-disable @next/next/no-head-element */
import { DEFAULT_KPI_COLUMNS } from "@/compare/columns";
import { compositeScore } from "@/compare/score";

function compute(deal: any) {
  const n = deal.numbers || {};
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
  const vac = grossAnnual * (vacancyPct / 100);
  const maint = grossAnnual * (maintenancePct / 100);
  const mgmt = grossAnnual * (managementPct / 100);
  const opEx = taxes + insurance + hoa * 12 + vac + maint + mgmt + otherMonthly * 12;
  const noi = grossAnnual - opEx;
  const allIn = purchase + rehab;
  const capRate = allIn > 0 ? noi / allIn : undefined;
  const down = allIn * (downPct / 100);
  const loanAmt = Math.max(allIn - down, 0);
  const r = (ratePct / 100) / 12;
  const nPmts = termYears * 12;
  const monthlyPI = loanAmt > 0 && r > 0 && nPmts > 0 ? (loanAmt * r) / (1 - Math.pow(1 + r, -nPmts)) : 0;
  const annualDebt = monthlyPI * 12;
  const dscr = annualDebt > 0 ? noi / annualDebt : undefined;
  const annualCF = noi - annualDebt;
  const coc = (down + rehab) > 0 ? annualCF / (down + rehab) : undefined;
  const grm = grossAnnual > 0 ? allIn / grossAnnual : undefined;
  const grossYield = allIn > 0 ? grossAnnual / allIn : undefined;
  const oer = grossAnnual > 0 ? opEx / grossAnnual : undefined;
  const holdingMonths = +n.holdingMonths || +n.monthsToComplete || 0;
  const sellingPct = (+n.sellingCostPct || 0) + (+n.closingCostPct || 0);
  const carryOtherMonthly = +n.carryOtherMonthly || 0;
  const carrying = (taxes / 12 + insurance / 12 + hoa + carryOtherMonthly) * holdingMonths;
  const selling = arv * (sellingPct / 100);
  const totalInvest = purchase + rehab + carrying + selling;
  const profit = arv - totalInvest;
  const margin = arv > 0 ? profit / arv : undefined;
  const em = totalInvest > 0 ? arv / totalInvest : undefined;
  return { capRate, dscr, annualCF, coc, grm, grossYield, oer, profit, margin, em };
}

export function renderCompareReportHTML({ deals, mode }: { deals: any[]; mode: string }) {
  const rows = deals.map(d => ({
    address: d.property?.address || d.title || d.id,
    kpis: compute(d),
  }));
  const ranges = {
    dscr: [Math.min(...rows.map(r => r.kpis.dscr || 0)), Math.max(...rows.map(r => r.kpis.dscr || 0))] as [number, number],
    cap: [Math.min(...rows.map(r => r.kpis.capRate || 0)), Math.max(...rows.map(r => r.kpis.capRate || 0))] as [number, number],
    cf: [Math.min(...rows.map(r => r.kpis.annualCF || 0)), Math.max(...rows.map(r => r.kpis.annualCF || 0))] as [number, number],
    profit: [Math.min(...rows.map(r => r.kpis.profit || 0)), Math.max(...rows.map(r => r.kpis.profit || 0))] as [number, number],
  };
  const weights = { dscr: 40, cap: 30, cf: 20, profit: 10 };
  const scored = rows.map(r => ({
    address: r.address,
    kpis: r.kpis,
    score: compositeScore({ dscr: r.kpis.dscr, capRate: r.kpis.capRate, annualCF: r.kpis.annualCF, profit: r.kpis.profit }, weights, ranges),
  }));

  const headerCols = DEFAULT_KPI_COLUMNS.map(c => `<th>${c.label}</th>`).join("");
  const bodyRows = scored
    .map(r => {
      const kpiCells = DEFAULT_KPI_COLUMNS.map(c => {
        const val = (r.kpis as any)[c.key];
        return `<td>${val !== undefined && val !== null ? (c.formatter?.(val) ?? val) : ""}</td>`;
      }).join("");
      return `<tr><td style="text-align:left">${r.address}</td>${kpiCells}<td>${(r.score * 100).toFixed(0)}</td></tr>`;
    })
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Deal Comparison</title><style>table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:4px;text-align:right;}th{text-align:left;}h1{font-size:20px;}</style></head><body><h1>Deal Comparison</h1><table><thead><tr><th>Property</th>${headerCols}<th>Score</th></tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;
}

