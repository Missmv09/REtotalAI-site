'use client';
import React, { useMemo, useState, useEffect } from "react";
import { api } from "@/lib/api";

function Modal({ open, onClose, children }) {
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 ${open ? '' : 'hidden'}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
        }
      }}
    >
      <div
        className="dialog-content w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl overscroll-contain"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function REtotalAiLandingPricing() {
  const [billing, setBilling] = useState("monthly");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [trial, setTrial] = useState<{ active: boolean; endsAt: any }>({ active: false, endsAt: null });

  const [address, setAddress] = useState("");
  const [purchase, setPurchase] = useState<string>("");
  const [arv, setArv] = useState<string>("");
  const [rehab, setRehab] = useState<string>("");
  const [rent, setRent] = useState<string>("");
  const [propertyType, setPropertyType] = useState<string>("Single Family");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [taxes, setTaxes] = useState<string>("2400");           // annual $
  const [insurance, setInsurance] = useState<string>("1200");   // annual $
  const [hoa, setHoa] = useState<string>("0");                  // monthly $
  const [vacancyPct, setVacancyPct] = useState<string>("5");    // % of rent
  const [maintenancePct, setMaintenancePct] = useState<string>("7"); // % of rent
  const [managementPct, setManagementPct] = useState<string>("8");   // % of rent
  const [otherMonthly, setOtherMonthly] = useState<string>("0");     // monthly $

  const [downPct, setDownPct] = useState<string>("20");         // %
  const [ratePct, setRatePct] = useState<string>("7");          // APR %
  const [termYears, setTermYears] = useState<string>("30");     // years

  // Flip assumptions
  const [holdingMonths, setHoldingMonths] = useState<string>("6");    // months
  const [sellingCostPct, setSellingCostPct] = useState<string>("8");  // % of ARV (agent etc.)
  const [closingCostPct, setClosingCostPct] = useState<string>("2");  // % of ARV (seller closing)
  const [carryOtherMonthly, setCarryOtherMonthly] = useState<string>("150"); // other monthly carry

  useEffect(() => {
    (async () => {
      try {
        const data = await api("/api/trial/status");
        setTrial(data);
      } catch {}
    })();
  }, []);

  const price = useMemo(() => ({
    monthly: { starter: 19, pro: 49, team: 99 },
    annual: { starter: 190, pro: 490, team: 990 },
  }), []);
  const isAnnual = billing === "annual";

  function num(v: any) {
    const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
    return isFinite(n) ? n : 0;
  }

  const purchaseNum = num(purchase);
  const arvNum = num(arv);
  const rehabNum = num(rehab);
  const rentNum = num(rent);
  const annualRent = rentNum * 12;
  const estTaxesInsMaint = purchaseNum * 0.03;
  const noi = annualRent - estTaxesInsMaint;
  const capRate = purchaseNum ? (noi / purchaseNum) * 100 : 0;
  const cashInvested = purchaseNum * 0.2 + rehabNum;
  const annualCashFlow = noi - purchaseNum * 0.8 * 0.07;
  const coc = cashInvested ? (annualCashFlow / cashInvested) * 100 : 0;

  const canSubmit = useMemo(() => {
    const p = Number(purchase);
    const a = Number(arv);
    return (
      address.trim().length > 3 &&
      Number.isFinite(p) && p > 0 &&
      Number.isFinite(a) && a > 0 &&
      !submitting
    );
  }, [address, purchase, arv, submitting]);

  async function handleStartTrial(entryPoint = "hero") {
    try {
      const data = await api("/api/trial/start", {
        method: "POST",
        body: JSON.stringify({ entryPoint }),
      });
      setTrial({ active: true, endsAt: data.trialEndsAt });
      setWizardOpen(true);
    } catch (e) {
      alert("Could not start trial");
    }
  }

  async function handleCheckout(planId: string) {
    try {
      const { url } = await api("/api/checkout/session", {
        method: "POST",
        body: JSON.stringify({ planId, billing }),
      });
      if (url) window.location.href = url;
    } catch (e) {
      alert("Checkout unavailable");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        property: { address: address.trim(), type: propertyType },
        numbers: {
          purchase: Number(purchase) || 0,
          arv: Number(arv) || 0,
          rehab: Number(rehab) || 0,
          rent: Number(rent) || 0,

          taxes: Number(taxes) || 0,
          insurance: Number(insurance) || 0,
          hoa: Number(hoa) || 0,
          vacancyPct: Number(vacancyPct) || 0,
          maintenancePct: Number(maintenancePct) || 0,
          managementPct: Number(managementPct) || 0,
          otherMonthly: Number(otherMonthly) || 0,

          downPct: Number(downPct) || 0,
          ratePct: Number(ratePct) || 0,
          termYears: Number(termYears) || 0,

          holdingMonths: Number(holdingMonths) || 0,
          sellingCostPct: Number(sellingCostPct) || 0,
          closingCostPct: Number(closingCostPct) || 0,
          carryOtherMonthly: Number(carryOtherMonthly) || 0,
        },
      };
      const deal = await api("/api/deals", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const pdfUrl = `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/deals/${deal.id}/report`;
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      setError(err?.message || "Failed to generate report.");
    } finally {
      setSubmitting(false);
    }
  }

  function PriceTag({ amount }: { amount: number }) {
    return (
      <div className="text-4xl font-bold tracking-tight">${amount}<span className="text-sm font-medium text-gray-500">/{isAnnual ? "yr" : "mo"}</span></div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-indigo-600/90" />
            <span className="font-semibold text-lg">REtotalAi</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900">Features</a>
            <a href="#pricing" className="hover:text-gray-900">Pricing</a>
            <a href="#how" className="hover:text-gray-900">How it works</a>
          </nav>
          <div className="flex items-center gap-3">
            {trial.active && trial.endsAt ? (
              <span className="text-xs text-gray-600">Trial active • ends {new Date(trial.endsAt).toLocaleDateString()}</span>
            ) : null}
            <button onClick={() => (trial.active ? setWizardOpen(true) : handleStartTrial("nav"))} data-cta="start-trial-nav" className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-black">{trial.active ? "Analyze a Deal" : "Start Free Trial"}</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-gray-600">
            <span className="h-2 w-2 rounded-full bg-green-500"/> New: First deal free
          </div>
          <h1 className="mt-4 text-4xl md:text-6xl font-extrabold leading-tight">Analyze Your First Deal <span className="text-indigo-600">Free</span></h1>
          <p className="mt-4 text-lg text-gray-600">Professional-grade AI Deal Analyzer with full platform access for 7 days. Get instant ROI, cash-on-cash, IRR, rehab budgets, and lender-ready reports.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button onClick={() => (trial.active ? setWizardOpen(true) : handleStartTrial("hero"))} data-cta="start-trial-hero" className="px-6 py-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20">Start Free Trial — Analyze a Deal</button>
            <a href="#pricing" className="px-6 py-3 rounded-2xl border hover:bg-gray-50">See Pricing</a>
          </div>
          <p className="mt-3 text-sm text-gray-500">Includes full access to all 8 AI tools. No credit card required to start.</p>
          <div className="mt-6 flex items-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-gray-400"/> Pro-grade accuracy</div>
            <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-gray-400"/> Lender-ready PDF reports</div>
            <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-gray-400"/> Integrates with comps & rehab</div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-indigo-600/10 blur-2xl"/>
          <div className="relative rounded-3xl border bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between"><h3 className="font-semibold">Deal Analyzer Preview</h3><span className="text-xs text-gray-500">AI Powered</span></div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {["Purchase Price","ARV","Rehab Budget","Rent","Cap Rate","Cash-on-Cash"].map((label, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="h-10 rounded-xl border px-3 flex items-center text-sm bg-gray-50">Auto-estimated</div>
                </div>
              ))}
            </div>
            <div className="mt-4 h-28 rounded-xl border bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center text-sm text-gray-600">Chart & projections preview</div>
            <button onClick={() => (trial.active ? setWizardOpen(true) : handleStartTrial("hero-preview"))} data-cta="start-trial-preview" className="mt-5 w-full rounded-xl bg-gray-900 text-white py-3 hover:bg-black">Analyze My First Deal Free</button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { t: "AI Deal Analyzer", d: "Instant ROI, IRR, cash flow, rehab budgets, sensitivity analysis." },
            { t: "Comps & Valuation", d: "Pull comps, adjust, and auto-calc ARV with explainability." },
            { t: "Fix & Flip Toolkit", d: "Scope builder, cost templates, lender-ready packages." },
            { t: "Rental & BRRRR", d: "DSCR, cap rate, vacancy, taxes, and long-term projections." },
            { t: "Acquisition CRM", d: "Track leads, offers, and pipeline with smart follow-ups." },
            { t: "Team Collab", d: "Comments, sharing, roles, and audit logs for brokers/teams." },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-indigo-600">{f.t}</div>
              <p className="mt-2 text-sm text-gray-600">{f.d}</p>
              <button onClick={() => (trial.active ? setWizardOpen(true) : handleStartTrial(`feature:${f.t}`))} className="mt-4 text-sm text-indigo-700 hover:underline">Try Free →</button>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold">Pricing that pays for itself</h2>
            <p className="text-gray-600 mt-2">Start with your first deal free. Upgrade anytime.</p>
          </div>
          <div className="flex items-center gap-3 rounded-full border px-2 py-1 text-sm">
            <button onClick={() => setBilling("monthly")} className={`px-3 py-1 rounded-full ${!isAnnual ? "bg-gray-900 text-white" : ""}`}>Monthly</button>
            <button onClick={() => setBilling("annual")} className={`px-3 py-1 rounded-full ${isAnnual ? "bg-gray-900 text-white" : ""}`}>Annual <span className="ml-1 text-xs text-gray-300">(2 mo free)</span></button>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {/* Starter */}
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Starter</div>
            <div className="mt-2"><PriceTag amount={isAnnual ? price.annual.starter : price.monthly.starter} /></div>
            <p className="mt-2 text-sm text-gray-600">For new investors getting started.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>AI Deal Analyzer</li>
              <li>1 additional AI tool</li>
              <li>Unlimited reports</li>
              <li>Email support</li>
            </ul>
            <button onClick={() => handleCheckout("starter")} data-cta="checkout-starter" className="mt-6 w-full rounded-xl bg-gray-900 text-white py-3 hover:bg-black">Choose Starter</button>
          </div>

          {/* Pro */}
          <div className="relative rounded-3xl border-2 border-indigo-600 bg-white p-6 shadow-lg">
            <div className="absolute -top-3 right-6 text-xs bg-indigo-600 text-white px-2 py-1 rounded-full">Most Popular</div>
            <div className="text-sm font-semibold text-gray-900">Pro</div>
            <div className="mt-2"><PriceTag amount={isAnnual ? price.annual.pro : price.monthly.pro} /></div>
            <p className="mt-2 text-sm text-gray-600">Full access to all 8 AI tools.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>Everything in Starter</li>
              <li>Comps & ARV, Rehab Toolkit</li>
              <li>Rental/BRRRR models & DSCR</li>
              <li>Lender-ready PDFs</li>
              <li>Priority support</li>
            </ul>
            <button onClick={() => handleCheckout("pro")} data-cta="checkout-pro" className="mt-6 w-full rounded-xl bg-indigo-600 text-white py-3 hover:bg-indigo-700">Go Pro</button>
          </div>

          {/* Team */}
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Team</div>
            <div className="mt-2"><PriceTag amount={isAnnual ? price.annual.team : price.monthly.team} /></div>
            <p className="mt-2 text-sm text-gray-600">For brokers & teams that collaborate.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>All Pro features</li>
              <li>Seats & roles</li>
              <li>Shared libraries & templates</li>
              <li>API access</li>
            </ul>
            <button onClick={() => handleCheckout("team")} data-cta="checkout-team" className="mt-6 w-full rounded-xl bg-gray-900 text-white py-3 hover:bg-black">Choose Team</button>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500">Prices in USD. Cancel anytime. Taxes may apply.</p>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-16">
        <h3 className="text-2xl font-bold">How the free trial works</h3>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          {[
            { t: "Start your trial", d: "No credit card required. Analyze your first deal with all pro features." },
            { t: "Explore all 8 tools", d: "Use comps, rehab, rental, and reporting without limits for 7 days." },
            { t: "Keep what you build", d: "Your deals & reports stay saved. Upgrade to continue analyzing." },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border bg-white p-6">
              <div className="text-sm font-semibold text-gray-900">{i+1}. {s.t}</div>
              <p className="mt-2 text-sm text-gray-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>


      {/* Deal Wizard Modal */}
      <Modal open={wizardOpen} onClose={() => setWizardOpen(false)}>
        <form
          onSubmit={onSubmit}
          onKeyDown={(e) => {
            const el = e.target as HTMLElement;
            const tag = el.tagName.toLowerCase();
            const type = (el as HTMLInputElement).type;
            const textLike = tag === 'textarea' || (tag === 'input' && ['text','search','email','url','tel','password','number'].includes(type));
            if (e.key === 'Enter' && !textLike) {
              e.preventDefault();
            }
          }}
        >
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold">Analyze a Deal</h3>
            <button type="button" onClick={() => setWizardOpen(false)} className="text-sm text-gray-500">Close</button>
          </div>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-600">Property Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 w-full h-10 rounded-xl border px-3" placeholder="123 Main St, City" />
            </div>
            {/* Property Type */}
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Property Type</label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
              >
                <option>Single Family</option>
                <option>Condo</option>
                <option>Townhouse</option>
                <option>Duplex</option>
                <option>Triplex</option>
                <option>Fourplex</option>
                <option>Multi-Family (5+)</option>
                <option>Mixed-Use</option>
                <option>Land</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600">Purchase ($)</label>
              <input value={purchase} onChange={(e) => setPurchase(e.target.value)} className="mt-1 w-full h-10 rounded-xl border px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-600">ARV ($)</label>
              <input value={arv} onChange={(e) => setArv(e.target.value)} className="mt-1 w-full h-10 rounded-xl border px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-600">Rehab Budget ($)</label>
              <input value={rehab} onChange={(e) => setRehab(e.target.value)} className="mt-1 w-full h-10 rounded-xl border px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-600">Estimated Rent ($/mo)</label>
              <input value={rent} onChange={(e) => setRent(e.target.value)} className="mt-1 w-full h-10 rounded-xl border px-3" />
            </div>
          </div>
          <div className="mt-4 grid md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-500">Cap Rate</div>
              <div className="font-semibold">{capRate.toFixed(1)}%</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-500">Cash-on-Cash</div>
              <div className="font-semibold">{coc.toFixed(1)}%</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-500">Annual Cash Flow</div>
              <div className="font-semibold">${Math.round(annualCashFlow).toLocaleString()}</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              className="text-sm underline"
              onClick={() => {
                setAddress("123 Main St Cityville, USA");
                setPurchase("250000");
                setArv("350000");
                setRehab("50000");
                setRent("2200");
                setPropertyType("Single Family");
              }}
            >
              Try demo values
            </button>
            {error ? <p className="text-sm text-red-600">{error}</p> : <span />}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-sm underline"
              onClick={() => {
                setAddress("742 Evergreen Terrace, Springfield, USA");
                setPropertyType("Single Family");
                setPurchase("180000");
                setArv("220000");
                setRehab("15000");
                setRent("1950");
                // expenses/financing (rental demo)
                setTaxes("2400"); setInsurance("1200"); setHoa("0");
                setVacancyPct("5"); setMaintenancePct("7"); setManagementPct("8"); setOtherMonthly("0");
                setDownPct("20"); setRatePct("7"); setTermYears("30");
                // flip
                setHoldingMonths("6"); setSellingCostPct("8"); setClosingCostPct("2"); setCarryOtherMonthly("150");
              }}
            >
              Rental demo
            </button>

            <button
              type="button"
              className="text-sm underline"
              onClick={() => {
                setAddress("75 Maple Ave, Nashville, TN");
                setPropertyType("Single Family");
                setPurchase("220000");
                setArv("360000");
                setRehab("40000");
                setRent(""); // not needed for flip
                // expenses/financing (not essential for flip, keep defaults)
                setTaxes("2400"); setInsurance("1200"); setHoa("0");
                setVacancyPct("5"); setMaintenancePct("7"); setManagementPct("0"); setOtherMonthly("0");
                setDownPct("20"); setRatePct("8"); setTermYears("30");
                // flip assumptions (flip demo)
                setHoldingMonths("6"); setSellingCostPct("10"); setClosingCostPct("2"); setCarryOtherMonthly("200");
              }}
            >
              Flip demo
            </button>
          </div>

          <div className="mt-6 border rounded-xl p-4">
            <details open>
              <summary className="cursor-pointer font-medium">Expenses & Financing</summary>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Taxes (annual)</label>
                  <input className="w-full rounded-md border px-3 py-2"
                    value={taxes} onChange={e=>setTaxes(e.target.value)} inputMode="numeric" />
                </div>
                <div>
                  <label className="text-sm">Insurance (annual)</label>
                  <input className="w-full rounded-md border px-3 py-2"
                    value={insurance} onChange={e=>setInsurance(e.target.value)} inputMode="numeric" />
                </div>
                <div>
                  <label className="text-sm">HOA (monthly)</label>
                  <input className="w-full rounded-md border px-3 py-2"
                    value={hoa} onChange={e=>setHoa(e.target.value)} inputMode="numeric" />
                </div>
                <div>
                  <label className="text-sm">Vacancy (%)</label>
                  <input className="w-full rounded-md border px-3 py-2"
                    value={vacancyPct} onChange={e=>setVacancyPct(e.target.value)} inputMode="numeric" />
                </div>
                <div>
                  <label className="text-sm">Maintenance (%)</label>
                  <input className="w-full rounded-md border px-3 py-2"
                    value={maintenancePct} onChange={e=>setMaintenancePct(e.target.value)} inputMode="numeric" />
                </div>
                <div>
                  <label className="text-sm">Management (%)</label>
                  <input className="w-full rounded-md border px-3 py-2"
                    value={managementPct} onChange={e=>setManagementPct(e.target.value)} inputMode="numeric" />
                </div>
                <div>
                  <label className="text-sm">Other (monthly)</label>
                  <input className="w-full rounded-md border px-3 py-2"
                    value={otherMonthly} onChange={e=>setOtherMonthly(e.target.value)} inputMode="numeric" />
                </div>

                <div className="col-span-2 border-t pt-4 mt-2">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm">Down Payment (%)</label>
                      <input className="w-full rounded-md border px-3 py-2"
                        value={downPct} onChange={e=>setDownPct(e.target.value)} inputMode="numeric" />
                    </div>
                    <div>
                      <label className="text-sm">Interest Rate (APR %)</label>
                      <input className="w-full rounded-md border px-3 py-2"
                        value={ratePct} onChange={e=>setRatePct(e.target.value)} inputMode="numeric" />
                    </div>
                    <div>
                      <label className="text-sm">Loan Term (years)</label>
                      <input className="w-full rounded-md border px-3 py-2"
                        value={termYears} onChange={e=>setTermYears(e.target.value)} inputMode="numeric" />
                    </div>
                  </div>
                </div>
              </div>
            </details>
          </div>

          <div className="mt-4 border rounded-xl p-4">
            <details>
              <summary className="cursor-pointer font-medium">Flip Assumptions</summary>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Holding Months</label>
                  <input className="w-full rounded-md border px-3 py-2"
                    value={holdingMonths} onChange={e=>setHoldingMonths(e.target.value)} inputMode="numeric" />
                </div>
                <div>
                  <label className="text-sm">Agent/Selling Costs (% of ARV)</label>
                  <input className="w-full rounded-md border px-3 py-2"
                    value={sellingCostPct} onChange={e=>setSellingCostPct(e.target.value)} inputMode="numeric" />
                </div>
                <div>
                  <label className="text-sm">Seller Closing (% of ARV)</label>
                  <input className="w-full rounded-md border px-3 py-2"
                    value={closingCostPct} onChange={e=>setClosingCostPct(e.target.value)} inputMode="numeric" />
                </div>
                <div>
                  <label className="text-sm">Other Carry (monthly)</label>
                  <input className="w-full rounded-md border px-3 py-2"
                    value={carryOtherMonthly} onChange={e=>setCarryOtherMonthly(e.target.value)} inputMode="numeric" />
                </div>
              </div>
            </details>
          </div>
          <div className="mt-5">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              disabled={!canSubmit}
            >
              {submitting ? "Generating…" : "Generate Report"}
            </button>
          </div>
          {!trial.active && (
            <p className="mt-3 text-xs text-gray-500">Tip: Start your free trial to unlock unlimited tools for 7 days.</p>
          )}
        </form>
      </Modal>
      {/* Paywall Modal */}
      <Modal open={paywallOpen} onClose={() => setPaywallOpen(false)}>
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">Unlock more deal analyses</h3>
          <button type="button" onClick={() => setPaywallOpen(false)} className="text-sm text-gray-500">Close</button>
        </div>
        <p className="mt-3 text-sm text-gray-600">You&apos;ve used your free analysis. Start your 7‑day trial or choose a plan to analyze unlimited deals and generate lender-ready PDFs.</p>
        <div className="mt-5 grid sm:grid-cols-3 gap-3">
          <button onClick={() => handleCheckout("starter")} className="rounded-xl border p-3 hover:bg-gray-50 text-left">
            <div className="text-sm font-semibold">Starter</div>
            <div className="text-xs text-gray-600">Deal Analyzer + 1 tool</div>
          </button>
          <button onClick={() => handleCheckout("pro")} className="rounded-xl border p-3 hover:bg-gray-50 text-left">
            <div className="text-sm font-semibold">Pro</div>
            <div className="text-xs text-gray-600">All 8 AI tools</div>
          </button>
          <button onClick={() => handleCheckout("team")} className="rounded-xl border p-3 hover:bg-gray-50 text-left">
            <div className="text-sm font-semibold">Team</div>
            <div className="text-xs text-gray-600">Seats & collaboration</div>
          </button>
        </div>
        <div className="mt-4">
          <button onClick={() => handleStartTrial("paywall")} className="px-5 py-2 rounded-xl bg-gray-900 text-white hover:bg-black">Start Free Trial</button>
        </div>
      </Modal>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-10 text-sm text-gray-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} REtotalAi</div>
          <div className="flex gap-6">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

