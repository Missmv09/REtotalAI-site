import cors from "cors";
// ===============================
// REtotalAi — Server Scaffold
// Tech: Express + (optional) Prisma + (optional) Stripe
// Drop this into /server and run:  npm i  &&  node index.js
// .env (optional):
//   PORT=4000
//   FRONTEND_URL=http://localhost:3000
//   STRIPE_SECRET_KEY=sk_test_...
//   STRIPE_WEBHOOK_SECRET=whsec_...
//   PRICE_STARTER_MONTHLY=price_xxx
//   PRICE_STARTER_ANNUAL=price_xxx
//   PRICE_PRO_MONTHLY=price_xxx
//   PRICE_PRO_ANNUAL=price_xxx
//   PRICE_TEAM_MONTHLY=price_xxx
//   PRICE_TEAM_ANNUAL=price_xxx
// ===============================

import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import PDFDocument from "pdfkit";

// Optional Stripe. If no key, endpoints still respond with a mock URL.
let stripe = null;
try {
  const Stripe = (await import("stripe")).default;
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
} catch {}

const app = express();

// Build CORS allowlist from env (deduped) and include Render URL automatically
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const EXTRA_URLS = (process.env.FRONTEND_URLS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || "";
const ALLOWED_ORIGINS = Array.from(
  new Set([FRONTEND_URL, ...EXTRA_URLS, RENDER_URL, "http://localhost:3000"].filter(Boolean))
);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // non-browser tools
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try {
    const { hostname } = new URL(origin);
    if (hostname.endsWith(".vercel.app")) return true;
  } catch {}
  return false;
};

const corsOriginFn = (origin, cb) => {
  const ok = isAllowedOrigin(origin);
  if (!ok) console.warn("[CORS] denied origin:", origin, "allowed:", ALLOWED_ORIGINS);
  return cb(null, ok);
};

// Main CORS middleware
app.use(cors({ origin: corsOriginFn, credentials: false }));
// No wildcard route handlers (Express 5-safe). Manual OPTIONS handler below is the only preflight logic.
app.use((req, res, next) => {
  if (req.method !== "OPTIONS") return next();
  const origin = req.headers.origin;
  corsOriginFn(origin, (_err, ok) => {
    if (ok) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
    res.setHeader(
      "Access-Control-Allow-Methods",
      req.header("Access-Control-Request-Method") || "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      req.header("Access-Control-Request-Headers") || ""
    );
    res.status(204).end();
  });
});

const PORT = Number(process.env.PORT) || 4000;

app.use(bodyParser.json());

// In-memory store (replace with Prisma soon)
const db = {
  users: new Map(),
  trials: new Map(), // userId -> { active, endsAt, entryPoint }
  deals: new Map(),  // dealId -> { userId, property, numbers, createdAt }
  entitlements: new Map(), // userId -> { tools, expiresAt }
};

function getUserId(req) {
  // TODO: replace with auth; for now, accept header 'x-user-id' or assign anon per session
  return req.header("x-user-id") || "anon";
}

// ---------------------------
// Trial API
// ---------------------------
app.post("/api/trial/start", (req, res) => {
  const userId = getUserId(req);
  const { entryPoint = "unknown" } = req.body || {};

  const existing = db.trials.get(userId);
  if (existing?.active && new Date(existing.endsAt) > new Date()) {
    return res.json(existing);
  }
  const endsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const trial = { active: true, entryPoint, endsAt: endsAt.toISOString() };
  db.trials.set(userId, trial);
  db.entitlements.set(userId, { tools: "all", expiresAt: endsAt.toISOString() });
  return res.json({ ok: true, trialEndsAt: trial.endsAt });
});

app.get("/api/trial/status", (req, res) => {
  const userId = getUserId(req);
  const t = db.trials.get(userId);
  const active = !!t && new Date(t.endsAt) > new Date();
  return res.json({ active, endsAt: t?.endsAt || null });
});

// ---------------------------
// Checkout API (Stripe or mock)
// ---------------------------
app.post("/api/checkout/session", async (req, res) => {
  const { planId = "starter", billing = "monthly" } = req.body || {};
  if (!stripe) {
    // Mock URL so frontend flow continues during dev
    const url = `${FRONTEND_URL}/checkout/mock?plan=${planId}&billing=${billing}`;
    return res.json({ url });
  }
  const priceMap = {
    starter: { monthly: process.env.PRICE_STARTER_MONTHLY, annual: process.env.PRICE_STARTER_ANNUAL },
    pro: { monthly: process.env.PRICE_PRO_MONTHLY, annual: process.env.PRICE_PRO_ANNUAL },
    team: { monthly: process.env.PRICE_TEAM_MONTHLY, annual: process.env.PRICE_TEAM_ANNUAL },
  };
  const price = priceMap[planId]?.[billing];
  if (!price) return res.status(400).json({ error: "Unknown plan/billing" });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{ price, quantity: 1 }],
    mode: "subscription",
    success_url: `${FRONTEND_URL}/success`,
    cancel_url: `${FRONTEND_URL}/pricing`,
  });
  return res.json({ url: session.url });
});

// ---------------------------
// Deals + Report
// ---------------------------
app.post("/api/deals", (req, res) => {
  const userId = getUserId(req);
  const t = db.trials.get(userId);
  const activeTrial = !!t && new Date(t.endsAt) > new Date();

  // Simple metering: allow 1 free deal without trial; otherwise require trial/subscription
  const dealsByUser = [...db.deals.values()].filter((d) => d.userId === userId);
  if (!activeTrial && dealsByUser.length >= 1) {
    return res.status(402).json({ error: "PAYWALL", message: "Start trial or subscribe to analyze more deals." });
  }

  const { property = {}, numbers = {} } = req.body || {};
  const id = crypto.randomUUID();
  const deal = { id, userId, property, numbers, createdAt: new Date().toISOString() };
  db.deals.set(id, deal);
  return res.json(deal);
});

app.get("/api/deals/:id/report", (req, res) => {
  const deal = db.deals.get(req.params.id);
  if (!deal) return res.status(404).send("Not found");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="deal-${deal.id}.pdf"`);

  const doc = new PDFDocument({ size: "LETTER", margin: 50 });
  doc.pipe(res);

  const n = deal.numbers || {};
  const p = (k, d = 0) => (Number.isFinite(+n[k]) ? +n[k] : d);

  // helpers
  const $ = (v) => (Number.isFinite(+v) ? `$${Number(v).toLocaleString()}` : "-");
  const pct = (v) => (Number.isFinite(+v) ? `${Number(v).toFixed(1)}%` : "-");
  const line = (label, value) => {
    doc.font("Helvetica").fontSize(11);
    const L = `${label}`.padEnd(20, " ");
    doc.text(`${L} ${value}`);
  };

  // Header
  doc.fontSize(20).text("Deal Analysis Report");
  doc.moveDown(0.5);
  doc
    .fontSize(10)
    .fillColor("#555")
    .text(`Generated: ${new Date().toLocaleString()}`);
  doc.moveDown();
  doc.fillColor("black");
  doc.fontSize(12).text(`Property: ${deal.property?.address || "N/A"}`);
  if (deal.property?.type) doc.text(`Type: ${deal.property.type}`);
  doc.moveDown();

  // Raw numbers
  line("Purchase:", $(p("purchase")));
  line("ARV:", $(p("arv")));
  line("Rehab:", $(p("rehab")));
  if (Number.isFinite(+p("rent"))) line("Rent (monthly):", $(p("rent")));
  doc.moveDown();

  // -------- Rental Section --------
  const rent = p("rent");
  const purchase = p("purchase");
  const arv = p("arv");
  const rehab = p("rehab");

  const taxes = p("taxes");
  const insurance = p("insurance");
  const hoa = p("hoa");
  const vacancyPct = p("vacancyPct");
  const maintenancePct = p("maintenancePct");
  const managementPct = p("managementPct");
  const otherMonthly = p("otherMonthly");

  const downPct = p("downPct");
  const ratePct = p("ratePct");
  const termYears = p("termYears");

  if (rent > 0) {
    doc.moveDown().fontSize(14).text("Rental Analysis", { underline: true });
    doc.moveDown(0.3);

    const grossAnnual = rent * 12;

    const vac = grossAnnual * (vacancyPct / 100);
    const maint = grossAnnual * (maintenancePct / 100);
    const mgmt = grossAnnual * (managementPct / 100);

    const hoaAnnual = hoa * 12;
    const otherAnnual = otherMonthly * 12;

    const opEx = taxes + insurance + hoaAnnual + vac + maint + mgmt + otherAnnual;
    const noi = grossAnnual - opEx;

    const allIn = purchase + rehab;
    const capRate = allIn > 0 ? (noi / allIn) * 100 : NaN;

    // financing
    const down = allIn * (downPct / 100);
    const loanAmount = Math.max(allIn - down, 0);
    const r = (ratePct / 100) / 12;
    const nPmts = termYears * 12;
    let monthlyPI = 0;
    if (loanAmount > 0 && r > 0 && nPmts > 0) {
      monthlyPI = (loanAmount * r) / (1 - Math.pow(1 + r, -nPmts));
    }
    const annualDebt = monthlyPI * 12;
    const dscr = annualDebt > 0 ? noi / annualDebt : NaN;
    const annualCashFlow = noi - annualDebt;

    const cashInvested = down + rehab;
    const coc = cashInvested > 0 ? (annualCashFlow / cashInvested) * 100 : NaN;

    // print
    line("Gross Rent (annual):", $(grossAnnual));
    line("Taxes (annual):", $(taxes));
    line("Insurance (annual):", $(insurance));
    line("HOA (annual):", $(hoaAnnual));
    line(`Vacancy (${vacancyPct}%):`, $(vac));
    line(`Maintenance (${maintenancePct}%):`, $(maint));
    line(`Mgmt (${managementPct}%):`, $(mgmt));
    line("Other (annual):", $(otherAnnual));
    line("Operating Exp (annual):", $(opEx));
    line("NOI:", $(noi));
    line("All-in Basis:", $(allIn));
    line("Cap Rate:", pct(capRate));
    doc.moveDown(0.3);
    line("Loan Amount:", $(loanAmount));
    line("Annual Debt (P&I):", $(annualDebt));
    line("DSCR:", Number.isFinite(dscr) ? dscr.toFixed(2) : "-");
    line("Annual Cash Flow:", $(annualCashFlow));
    line("Cash Invested (down+rehab):", $(cashInvested));
    line("Cash-on-Cash:", pct(coc));
    doc.moveDown();
  }

  // -------- Flip Section --------
  const holdingMonths = p("holdingMonths");
  const sellingCostPct = p("sellingCostPct");
  const closingCostPct = p("closingCostPct");
  const carryOtherMonthly = p("carryOtherMonthly");

  if (arv > 0) {
    doc.moveDown().fontSize(14).text("Flip Analysis", { underline: true });
    doc.moveDown(0.3);

    const basis = purchase + rehab;

    // approximate interest carry on loan amount (using downPct and ratePct)
    const downFlip = basis * (downPct / 100);
    const loanFlip = Math.max(basis - downFlip, 0);
    const interestCarry = loanFlip * (ratePct / 100) * (holdingMonths / 12);
    const otherCarry = (carryOtherMonthly || 0) * holdingMonths;

    const sellCosts = arv * (sellingCostPct / 100);
    const closeCosts = arv * (closingCostPct / 100);

    const totalCost = basis + interestCarry + otherCarry + sellCosts + closeCosts;
    const profit = arv - totalCost;
    const margin = arv > 0 ? (profit / arv) * 100 : NaN;

    line("Basis (purchase + rehab):", $(basis));
    line(`Interest Carry (${ratePct}% for ${holdingMonths} mo):`, $(interestCarry));
    line("Other Carry:", $(otherCarry));
    line(`Selling Costs (${sellingCostPct}% of ARV):`, $(sellCosts));
    line(`Closing Costs (${closingCostPct}% of ARV):`, $(closeCosts));
    line("Total Cost:", $(totalCost));
    line("Profit:", $(profit));
    line("Margin:", pct(margin));
    doc.moveDown();
  }

  doc.end();
});

// ---------------------------
// Health
// ---------------------------
app.get("/health", (_req, res) => res.json({ ok: true }));

// Simple ping for smoke tests / diagnostics
app.get("/api/ping", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Friendly landing page for the API root (safe, noindex, no-store)
app.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Cache-Control", "no-store");
  const frontend = "https://r-etotal-ai-site.vercel.app";
  res.end(`<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>REtotalAi API</title>
      <style>
        :root { color-scheme: light dark; }
        body { font: 16px/1.5 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; padding: 2rem; }
        .card { max-width: 720px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 14px; padding: 1.25rem; }
        h1 { margin: 0 0 .25rem 0; }
        .muted { color: #6b7280; }
        a { color: #4f46e5; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>REtotalAi API</h1>
        <p class="muted">Backend is running on Render. The product UI is on Vercel.</p>
        <ul>
          <li><a href="/health">/health</a> — health check (JSON)</li>
          <li><a href="/api/ping">/api/ping</a> — ping (JSON, if present)</li>
          <li><a href="${frontend}">${frontend}</a> — open the app</li>
        </ul>
      </div>
    </body>
  </html>`);
});

// 404
app.use((req, res) => res.status(404).json({ error: "Not found", path: req.path }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});
app.listen(PORT, () => {
  console.log(`✅ REtotalAi server on http://localhost:${PORT}`);
  console.log("CORS allowlist:", ALLOWED_ORIGINS);
});

// ===============================
// Prisma schema (optional; create prisma/schema.prisma)
// ===============================
/*
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  deals        Deal[]
  subscription Subscription?
  trial        Trial?
  entitlement  Entitlement?
}

model Deal {
  id         String   @id @default(cuid())
  user       User     @relation(fields: [userId], references: [id])
  userId     String
  property   Json
  numbers    Json
  createdAt  DateTime @default(now())
}

model Trial {
  userId    String  @id
  user      User    @relation(fields: [userId], references: [id])
  active    Boolean
  entryPoint String
  endsAt    DateTime
}

model Subscription {
  id        String @id @default(cuid())
  userId    String @unique
  user      User   @relation(fields: [userId], references: [id])
  plan      String
  billing   String
  status    String
  startedAt DateTime @default(now())
}

model Entitlement {
  userId   String  @id
  user     User    @relation(fields: [userId], references: [id])
  tools    String
  expiresAt DateTime
}
*/
