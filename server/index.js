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

// Optional Stripe. If no key, endpoints still respond with a mock URL.
let stripe = null;
try {
  const Stripe = (await import("stripe")).default;
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
} catch {}

const app = express();
app.use(cors({
  origin: [
    "https://retotalai.vercel.app", // deployed Vercel frontend
    "http://localhost:3000"         // keep for local development
  ],
  credentials: false
}));

const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

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

  // Minimal PDF (valid) — replace with real template generator later
  const text = `Deal Analysis Report\nProperty: ${deal.property.address || "N/A"}\nPurchase: ${deal.numbers.purchase || "-"}\nARV: ${deal.numbers.arv || "-"}\nRehab: ${deal.numbers.rehab || "-"}\nGenerated: ${new Date().toISOString()}`;
  const pdf = `%PDF-1.3\n1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n2 0 obj<< /Type /Pages /Count 1 /Kids [3 0 R] >>endobj\n3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>endobj\n4 0 obj<< /Length  ${text.length + 91} >>stream\nBT /F1 12 Tf 50 750 Td (${text.replace(/\n/g, ") T* (")}) Tj ET\nendstream endobj\n5 0 obj<< /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica >>endobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000120 00000 n \n0000000210 00000 n \n0000000430 00000 n \ntrailer<< /Size 6 /Root 1 0 R >>\nstartxref\n520\n%%EOF`;
  res.setHeader("Content-Type", "application/pdf");
  res.send(Buffer.from(pdf, "utf-8"));
});

// ---------------------------
// Health
// ---------------------------
app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`✅ REtotalAi server on http://localhost:${PORT}`));

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
