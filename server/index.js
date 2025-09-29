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
import fs from "fs";
import path from "path";

// Optional Stripe. If no key, endpoints still respond with a mock URL.
let stripe = null;
try {
  const Stripe = (await import("stripe")).default;
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
} catch {}

const app = express();

// Serve static assets (e.g., logo) from server/assets at /assets
app.use("/assets", express.static(path.join(process.cwd(), "server", "assets")));

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

// Deal report (PDF) — branded + two-column tables + rental & flip metrics
app.get("/api/deals/:id/report", (req, res) => {
  const deal = db.deals.get(req.params.id);
  if (!deal) return res.status(404).send("Not found");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="deal-${deal.id}.pdf"`
  );

  const doc = new PDFDocument({ size: "LETTER", margin: 48 });
  doc.pipe(res);

  // -----------------------------
  // Helpers
  // -----------------------------
  const n = deal.numbers || {};
  const getN = (k, d = 0) => (Number.isFinite(+n[k]) ? +n[k] : d);
  const $ = (v) => (Number.isFinite(+v) ? `$${Number(v).toLocaleString()}` : "—");
  const pct = (v, d = 1) => (Number.isFinite(+v) ? `${Number(v).toFixed(d)}%` : "—");
  const num = (v, d = 0) => (Number.isFinite(+v) ? Number(v).toFixed(d) : "—");
  const labelW = 220;               // left column width for labels
  const valX   = 320;               // x for values (right side)
  const lineH  = 16;
  const top    = 48;                 // top margin
  const left   = 48;                 // left margin
  const rightX = 564;                // content width end (Letter 612pt - 48pt margin)
  const bottom = () => doc.page.height - 48; // compute per-page in case page size changes
  let y = top + 72;                  // after first-page header

  // Paint a small header on a new page
  const paintPageHeader = () => {
    const brand = process.env.BRAND_NAME || "REtotalAi";
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#444").text(brand, left, top);
    doc.font("Helvetica").fontSize(9).fillColor("#666")
       .text(new Date().toLocaleString(), left, top + 12);
    doc.fillColor("black");
    y = top + 30; // leave a little space under the header
  };

  // Ensure we have space; if not, add page and repaint header
  const ensureSpace = (lines = 1) => {
    if (y + lineH * lines > bottom()) {
      doc.addPage();
      paintPageHeader();
    }
  };

  const moveDown = (lines = 1) => {
    ensureSpace(lines);
    y += lineH * lines;
  };

  const kv = (label, value) => {
    ensureSpace(1);
    doc.font("Helvetica").fontSize(11);
    doc.text(label, left, y, { width: labelW });
    doc.text(String(value), valX, y, { align: "left", width: rightX - valX });
    y += lineH;
  };

  const hr = () => {
    ensureSpace(1);
    doc.moveTo(left, y + 6).lineTo(rightX, y + 6).strokeColor("#ddd").stroke();
    y += lineH;
    doc.strokeColor("black");
  };

  const section = (title) => {
    ensureSpace(2);
    doc.font("Helvetica-Bold").fontSize(13).text(title, left, y);
    y += lineH;
    hr();
  };

  // -----------------------------
  // Header with brand and logo
  // -----------------------------
  const BRAND = process.env.BRAND_NAME || "REtotalAi";
  const logoPath =
    process.env.LOGO_PATH ||
    path.join(process.cwd(), "server", "assets", "logo.png");

  // Draw brand title (first page)
  doc.font("Helvetica-Bold")
    .fontSize(18)
    .text(`${BRAND} — Deal Analysis Report`, 48, 48);
  doc.font("Helvetica")
    .fontSize(10)
    .fillColor("#555")
    .text(`Generated: ${new Date().toLocaleString()}`, 48, 68);
  doc.fillColor("black");

  try {
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 480, 40, { width: 64 });
    }
  } catch {}

  // -----------------------------
  // Property summary
  // -----------------------------
  y = top + 60;
  section("Property");
  kv("Address", deal.property?.address || "N/A");
  kv("Type", deal.property?.type || "—");
  kv("Purchase Price", $(getN("purchase")));
  kv("After Repair Value (ARV)", $(getN("arv")));
  kv("Rehab Budget", $(getN("rehab")));
  if (Number.isFinite(+getN("rent"))) kv("Estimated Rent (monthly)", $(getN("rent")));
  moveDown();

  // -----------------------------
  // Rental Analysis
  // -----------------------------
  const purchase = getN("purchase");
  const arv = getN("arv");
  const rehab = getN("rehab");
  const rent = getN("rent");

  const taxes = getN("taxes");
  const insurance = getN("insurance");
  const hoa = getN("hoa");
  const vacancyPct = getN("vacancyPct");
  const maintenancePct = getN("maintenancePct");
  const managementPct = getN("managementPct");
  const otherMonthly = getN("otherMonthly");

  const downPct = getN("downPct");
  const ratePct = getN("ratePct");
  const termYears = getN("termYears");

  const amortPI = (loan, aprPct, years) => {
    const r = (aprPct / 100) / 12;
    const nPmts = years * 12;
    if (!(loan > 0) || !(r > 0) || !(nPmts > 0)) return 0;
    return (loan * r) / (1 - Math.pow(1 + r, -nPmts));
  };

  if (rent > 0) {
    section("Rental Analysis");
    const grossAnnual = rent * 12;
    const vac = grossAnnual * (vacancyPct / 100);
    const maint = grossAnnual * (maintenancePct / 100);
    const mgmt = grossAnnual * (managementPct / 100);
    const hoaAnnual = hoa * 12;
    const otherAnnual = otherMonthly * 12;
    const opEx = taxes + insurance + hoaAnnual + vac + maint + mgmt + otherAnnual;
    const noi = grossAnnual - opEx;
    const allIn = purchase + rehab;
    const cap = allIn > 0 ? (noi / allIn) * 100 : NaN;
    const down = allIn * (downPct / 100);
    const loanAmt = Math.max(allIn - down, 0);
    const monthlyPI = amortPI(loanAmt, ratePct, termYears);
    const annualDebt = monthlyPI * 12;
    const dscr = annualDebt > 0 ? noi / annualDebt : NaN;
    const annualCF = noi - annualDebt;
    const invested = down + rehab;
    const coc = invested > 0 ? (annualCF / invested) * 100 : NaN;
    const breakEvenRent = (opEx + annualDebt) / 12;
    const grm = grossAnnual > 0 ? allIn / grossAnnual : NaN;
    const grossYield = allIn > 0 ? (grossAnnual / allIn) * 100 : NaN;
    const oer = grossAnnual > 0 ? (opEx / grossAnnual) * 100 : NaN;

    kv("Gross Rent (annual)", $(grossAnnual));
    kv("Taxes (annual)", $(taxes));
    kv("Insurance (annual)", $(insurance));
    kv("HOA (annual)", $(hoaAnnual));
    kv(`Vacancy (${num(vacancyPct,1)}%)`, $(vac));
    kv(`Maintenance (${num(maintenancePct,1)}%)`, $(maint));
    kv(`Management (${num(managementPct,1)}%)`, $(mgmt));
    kv("Other (annual)", $(otherAnnual));
    kv("Operating Expenses (annual)", $(opEx));
    hr();
    kv("NOI", $(noi));
    kv("All-In Basis (Purchase + Rehab)", $(allIn));
    kv("Cap Rate", pct(cap));
    kv("Loan Amount", $(loanAmt));
    kv("Annual Debt (P&I)", $(annualDebt));
    kv("DSCR", Number.isFinite(dscr) ? num(dscr, 2) : "—");
    kv("Annual Cash Flow", $(annualCF));
    kv("Cash Invested (Down + Rehab)", $(invested));
    kv("Cash-on-Cash", pct(coc));
    hr();
    kv("Break-Even Rent (monthly)", $(breakEvenRent));
    kv("GRM (Price / Annual Rent)", Number.isFinite(grm) ? num(grm, 2) : "—");
    kv("Gross Yield", pct(grossYield));
    kv("Operating Expense Ratio (OER)", pct(oer));
    moveDown();
  }

  // -----------------------------
  // Flip Analysis
  // -----------------------------
  const holdingMonths = getN("holdingMonths");
  const sellingCostPct = getN("sellingCostPct");
  const closingCostPct = getN("closingCostPct");
  const hasClosingCostsTotal = Object.prototype.hasOwnProperty.call(n, "closingCostsTotal");
  const hasClosingCosts = Object.prototype.hasOwnProperty.call(n, "closingCosts");
  const closingCostsFromItemsRaw = hasClosingCostsTotal ? Number(n.closingCostsTotal) : (hasClosingCosts ? Number(n.closingCosts) : NaN);
  const closingCostsFromItems = Number.isFinite(closingCostsFromItemsRaw) ? closingCostsFromItemsRaw : null;
  const carryOtherMonthly = getN("carryOtherMonthly");

  // If we’re low on space before starting Flip, force a new page
  if (arv > 0) {
    if (y + lineH * 12 > bottom()) { // ~12 lines used in the Flip block
      doc.addPage();
      paintPageHeader();
    }
    section("Flip Analysis");
    const basis = purchase + rehab;
    const downFlip = basis * (downPct / 100);
    const loanFlip = Math.max(basis - downFlip, 0);
    const interestCarry = loanFlip * (ratePct / 100) * (holdingMonths / 12);
    const otherCarry = (carryOtherMonthly || 0) * (holdingMonths || 0);
    const sellCosts = arv * (sellingCostPct / 100);
    const closeCosts = closingCostsFromItems != null ? closingCostsFromItems : arv * (closingCostPct / 100);
    const totalCost = basis + interestCarry + otherCarry + sellCosts + closeCosts;
    const profit = arv - totalCost;
    const margin = arv > 0 ? (profit / arv) * 100 : NaN;
    const cashInvestedFlip = downFlip + rehab;
    const equityMultiple =
      cashInvestedFlip > 0 ? (profit + cashInvestedFlip) / cashInvestedFlip : NaN;

    kv("Basis (Purchase + Rehab)", $(basis));
    kv(`Interest Carry (${num(ratePct,2)}% APR for ${num(holdingMonths)} mo)`, $(interestCarry));
    kv("Other Carry", $(otherCarry));
    kv(`Selling Costs (${num(sellingCostPct,1)}% of ARV)`, $(sellCosts));
    const closingLabel = closingCostsFromItems != null ? "Closing Costs (itemized)" : `Closing Costs (${num(closingCostPct,1)}% of ARV)`;
    kv(closingLabel, $(closeCosts));
    hr();
    kv("Total Cost", $(totalCost));
    kv("Profit", $(profit));
    kv("Margin", pct(margin));
    kv("Cash Invested (Down + Rehab)", $(cashInvestedFlip));
    kv(
      "Equity Multiple",
      Number.isFinite(equityMultiple) ? num(equityMultiple, 2) : "—"
    );
    moveDown();
  }

  // Done
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

// List recent deals for test convenience
// GET /api/deals/recent?limit=10
app.get("/api/deals/recent", (req, res) => {
  const lim = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
  const items = [...db.deals.values()]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, lim)
    .map(d => ({
      id: d.id,
      address: d.property?.address || null,
      type: d.property?.type || null,
      createdAt: d.createdAt
    }));
  res.json({ deals: items });
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
