'use client';
import React, { useMemo, useState } from "react";

// REtotalAi — Landing + Pricing + Product-specific CTA (Frontend-only)
// This file must remain a React component. Backend (Express/Prisma/Stripe) should live
// in separate server files. The UI calls /api endpoints via fetch (stubbed here).

export default function REtotalAiLandingPricing() {
  const [billing, setBilling] = useState("monthly"); // 'monthly' | 'annual'

  const price = useMemo(() => ({
    monthly: { starter: 19, pro: 49, team: 99 },
    annual: { starter: 190, pro: 490, team: 990 }, // ~2 months free
  }), []);

  const isAnnual = billing === "annual";

  async function handleStartTrial(entryPoint = "hero") {
    try {
      // NOTE: implement on the server: POST /api/trial/start { entryPoint }
      // await fetch("/api/trial/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entryPoint })});
      alert("✅ Trial started. (Stubbed — wire to /api/trial/start)");
    } catch (e) {
      alert("⚠️ Could not start trial. Please try again.");
    }
  }

  async function handleCheckout(planId) {
    try {
      // NOTE: implement on the server: POST /api/checkout/session { planId, billing }
      // const res = await fetch("/api/checkout/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId, billing })});
      // const { url } = await res.json();
      // window.location.href = url;
      alert(`🧾 Checkout for ${planId} (${billing}). (Stubbed — wire to /api/checkout/session)`);
    } catch (e) {
      alert("⚠️ Could not launch checkout. Please try again.");
    }
  }

  function PriceTag({ amount }) {
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
            <button onClick={() => handleStartTrial("nav")}
              data-cta="start-trial-nav"
              className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-black">
              Start Free Trial
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-gray-600">
            <span className="h-2 w-2 rounded-full bg-green-500"/> New: First deal free
          </div>
          <h1 className="mt-4 text-4xl md:text-6xl font-extrabold leading-tight">
            Analyze Your First Deal <span className="text-indigo-600">Free</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Professional-grade AI Deal Analyzer with full platform access for 7 days. Get instant ROI, cash-on-cash, IRR, rehab budgets, and lender-ready reports.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button onClick={() => handleStartTrial("hero")}
              data-cta="start-trial-hero"
              className="px-6 py-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20">
              Start Free Trial — Analyze a Deal
            </button>
            <a href="#pricing" className="px-6 py-3 rounded-2xl border hover:bg-gray-50">See Pricing</a>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Includes full access to all 8 AI tools. No credit card required to start.
          </p>
          <div className="mt-6 flex items-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-gray-400"/> Pro-grade accuracy</div>
            <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-gray-400"/> Lender-ready PDF reports</div>
            <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-gray-400"/> Integrates with comps & rehab</div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-indigo-600/10 blur-2xl"/>
          <div className="relative rounded-3xl border bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Deal Analyzer Preview</h3>
              <span className="text-xs text-gray-500">AI Powered</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {["Purchase Price","ARV","Rehab Budget","Rent","Cap Rate","Cash-on-Cash"].map((label, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="h-10 rounded-xl border px-3 flex items-center text-sm bg-gray-50">Auto-estimated</div>
                </div>
              ))}
            </div>
            <div className="mt-4 h-28 rounded-xl border bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center text-sm text-gray-600">
              Chart & projections preview
            </div>
            <button onClick={() => handleStartTrial("hero-preview")}
              data-cta="start-trial-preview"
              className="mt-5 w-full rounded-xl bg-gray-900 text-white py-3 hover:bg-black">
              Analyze My First Deal Free
            </button>
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
              <button onClick={() => handleStartTrial(`feature:${f.t}`)} className="mt-4 text-sm text-indigo-700 hover:underline">Try Free →</button>
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
            <button onClick={() => handleCheckout("starter")}
              data-cta="checkout-starter"
              className="mt-6 w-full rounded-xl bg-gray-900 text-white py-3 hover:bg-black">Choose Starter</button>
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
            <button onClick={() => handleCheckout("pro")}
              data-cta="checkout-pro"
              className="mt-6 w-full rounded-xl bg-indigo-600 text-white py-3 hover:bg-indigo-700">Go Pro</button>
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
            <button onClick={() => handleCheckout("team")}
              data-cta="checkout-team"
              className="mt-6 w-full rounded-xl bg-gray-900 text-white py-3 hover:bg-black">Choose Team</button>
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

