import React from 'react'

type Plan = {
  name: string
  audience: string
  description: string
  bullets: string[]
  priceTag: string
  footnote: string
  href: string
  status?: 'LIVE' | 'NEW' | 'BETA'
}

const SHARED_PRICE = '$49/month'
const SHARED_FOOTNOTE =
  '3 free uses/month\nStarting at $49/month\nUnlimited analyses, save reports, export PDF'

const PLANS: Plan[] = [
  {
    name: 'Deal Analyzer',
    audience: 'FOR INVESTORS & FLIPPERS',
    description:
      'Instantly calculate ROI, cap rate, and cash flow on any property.',
    bullets: [
      'Real-time MLS data sync',
      'Advanced ROI calculations',
      'Market comparison engine',
    ],
    priceTag: SHARED_PRICE,
    footnote: SHARED_FOOTNOTE,
    href: '/deal-analyzer',
    status: 'LIVE',
  },
  {
    name: 'Price Optimizer',
    audience: 'FOR PROPERTY MANAGERS',
    description:
      'Dynamic pricing engine with neighborhood-level precision for maximum revenue.',
    bullets: [
      'Hyper local market analysis',
      'Seasonal adjustments',
      'Competition tracking',
    ],
    priceTag: SHARED_PRICE,
    footnote: SHARED_FOOTNOTE,
    href: '/price-optimizer',
    status: 'LIVE',
  },
  {
    name: 'Realtor Assistant',
    audience: 'FOR AGENTS & BROKERS',
    description:
      'Intelligent automation for listings, emails, and client communications.',
    bullets: ['Listing generator', 'Email automation', 'Follow up scheduler'],
    priceTag: SHARED_PRICE,
    footnote: SHARED_FOOTNOTE,
    href: '/realtor-assistant',
    status: 'NEW',
  },
  {
    name: 'Tenant Screening',
    audience: 'FOR LANDLORDS',
    description:
      'Advanced behavioral analysis beyond traditional credit checks.',
    bullets: ['Pattern recognition', 'Risk assessment', 'Predictive scoring'],
    priceTag: SHARED_PRICE,
    footnote: SHARED_FOOTNOTE,
    href: '/tenant-screening',
    status: 'LIVE',
  },
  {
    name: 'Zoning & Permits',
    audience: 'FOR DEVELOPERS',
    description:
      'Instant analysis of building potential and regulatory compliance.',
    bullets: ['Zoning interpretation', 'Code compliance', 'Permit checklists'],
    priceTag: SHARED_PRICE,
    footnote: SHARED_FOOTNOTE,
    href: '/zoning-permits',
    status: 'BETA',
  },
  {
    name: 'Home Matchmaker',
    audience: 'FOR BUYERS',
    description:
      'Intelligent property matching based on lifestyle and preferences.',
    bullets: ['Preference learning', 'Hidden gem finder', 'Commute analysis'],
    priceTag: SHARED_PRICE,
    footnote: SHARED_FOOTNOTE,
    href: '/home-matchmaker',
    status: 'LIVE',
  },
  {
    name: 'Renovation Estimator',
    audience: 'FOR INVESTORS & FLIPPERS',
    description:
      'Sqft-based renovation budgets using catalog pricing for materials and labor.',
    bullets: [
      'Quick sqft estimates',
      'Scope-by-scope cost breakdown',
      'Materials + labor + contingency',
    ],
    priceTag: SHARED_PRICE,
    footnote: SHARED_FOOTNOTE,
    href: '/renovations',
    status: 'NEW',
  },
]

function StatusBadge({ status }: { status?: Plan['status'] }) {
  if (!status) return null
  const label = status === 'LIVE' ? 'LIVE' : status === 'BETA' ? 'BETA' : 'NEW'
  const base =
    'text-[10px] font-semibold px-2 py-1 rounded-full inline-flex items-center'
  if (status === 'LIVE')
    return (
      <span className={`${base} bg-emerald-100 text-emerald-700`}>
        {label}
      </span>
    )
  if (status === 'BETA')
    return (
      <span className={`${base} bg-amber-100 text-amber-800`}>{label}</span>
    )
  return (
    <span className={`${base} bg-indigo-100 text-indigo-700`}>{label}</span>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div className="rounded-3xl border border-amber-50 bg-white p-6 flex flex-col justify-between shadow-sm">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full px-3 py-1">
          <span>{plan.priceTag}</span>
        </div>

        <div>
          <h3 className="text-lg font-semibold">{plan.name}</h3>
          <p className="text-xs uppercase tracking-wide text-gray-500 mt-1">
            {plan.audience}
          </p>
        </div>

        <p className="text-sm text-gray-600">{plan.description}</p>

        <ul className="mt-3 space-y-1 text-sm text-gray-700">
          {plan.bullets.map((b) => (
            <li key={b}>✓ {b}</li>
          ))}
        </ul>

        <p className="mt-3 text-xs text-gray-500 whitespace-pre-line">
          {plan.footnote}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <a
          href={plan.href}
          className="inline-flex items-center justify-center rounded-full bg-black text-white text-sm px-4 py-2"
        >
          Try Free
        </a>
        <StatusBadge status={plan.status} />
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#fdf7ec]">
      <section className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        <header className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Pricing that grows with your portfolio.
          </h1>
          <p className="text-sm text-gray-600">
            Start free with limited runs on each tool. Upgrade when you&apos;re
            ready to scale your deals, doors, and data.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
      </section>
    </main>
  )
}

