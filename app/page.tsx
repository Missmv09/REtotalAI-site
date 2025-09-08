'use client';
import React, { useMemo, useState, useEffect } from "react";
import { api } from "@/lib/api";

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
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
  const [busy, setBusy] = useState(false);
  const [deal, setDeal] = useState({
    property: { address: "" },
    numbers: { purchase: "", arv: "", rehab: "", rent: "" },
  });
  const [reportUrl, setReportUrl] = useState("");

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

  const purchase = num(deal.numbers.purchase);
  const arv = num(deal.numbers.arv);
  const rehab = num(deal.numbers.rehab);
  const rent = num(deal.numbers.rent);
  const annualRent = rent * 12;
  const estTaxesInsMaint = purchase * 0.03;
  const noi = annualRent - estTaxesInsMaint;
  const capRate = purchase ? (noi / purchase) * 100 : 0;
  const cashInvested = purchase * 0.2 + rehab;
  const annualCashFlow = noi - purchase * 0.8 * 0.07;
  const coc = cashInvested ? (annualCashFlow / cashInvested) * 100 : 0;

  const valid =
    deal.property.address.trim().length > 5 &&
    purchase > 0 &&
    arv > 0;

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

  async function submitDeal() {
    setBusy(true);
    try {
      const created = await api("/api/deals", {
        method: "POST",
        body: JSON.stringify(deal),
      });
      const blob = await api(`/api/deals/${created.id}/report`);
      const url = URL.createObjectURL(blob);
      setReportUrl(url);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      if (e.code === 402) {
        setWizardOpen(false);
        setPaywallOpen(true);
      } else {
        alert("Could not analyze deal");
      }
    } finally {
      setBusy(false);
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
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">Analyze a Deal</h3>
          <button onClick={() => setWizardOpen(false)} className="text-sm text-gray-500">Close</button>
        </div>
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-gray-600">Property Address</label>
            <input value={deal.property.address} onChange={(e) => setDeal(v => ({ ...v, property: { ...v.property, address: e.target.value }}))} className="mt-1 w-full h-10 rounded-xl border px-3" placeholder="123 Main St, City" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Purchase ($)</label>
            <input value={deal.numbers.purchase} onChange={(e) => setDeal(v => ({ ...v, numbers: { ...v.numbers, purchase: e.target.value }}))} className="mt-1 w-full h-10 rounded-xl border px-3" />
          </div>
          <div>
            <label className="text-xs text-gray-600">ARV ($)</label>
            <input value={deal.numbers.arv} onChange={(e) => setDeal(v => ({ ...v, numbers: { ...v.numbers, arv: e.target.value }}))} className="mt-1 w-full h-10 rounded-xl border px-3" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Rehab Budget ($)</label>
            <input value={deal.numbers.rehab} onChange={(e) => setDeal(v => ({ ...v, numbers: { ...v.numbers, rehab: e.target.value }}))} className="mt-1 w-full h-10 rounded-xl border px-3" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Estimated Rent ($/mo)</label>
            <input value={deal.numbers.rent} onChange={(e) => setDeal(v => ({ ...v, numbers: { ...v.numbers, rent: e.target.value }}))} className="mt-1 w-full h-10 rounded-xl border px-3" />
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
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={submitDeal}
            disabled={busy || !valid}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? "Analyzing…" : "Generate Report"}
          </button>
          {reportUrl && (
            <a href={reportUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-700 underline">
              Open report again
            </a>
          )}
        </div>
        {!trial.active && (
          <p className="mt-3 text-xs text-gray-500">Tip: Start your free trial to unlock unlimited tools for 7 days.</p>
        )}
      </Modal>

      {/* Paywall Modal */}
      <Modal open={paywallOpen} onClose={() => setPaywallOpen(false)}>
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">Unlock more deal analyses</h3>
          <button onClick={() => setPaywallOpen(false)} className="text-sm text-gray-500">Close</button>
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

