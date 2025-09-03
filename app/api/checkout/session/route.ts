import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2022-11-15',
});

const PRICE_IDS = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    annual: process.env.STRIPE_PRICE_STARTER_ANNUAL,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL,
  },
  team: {
    monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY,
    annual: process.env.STRIPE_PRICE_TEAM_ANNUAL,
  },
} as const;

type PlanId = keyof typeof PRICE_IDS;
type Billing = 'monthly' | 'annual';

export async function POST(req: Request) {
  const { planId, billing } = (await req.json()) as {
    planId: PlanId;
    billing: Billing;
  };

  if (!planId || !billing || !PRICE_IDS[planId]?.[billing]) {
    return NextResponse.json(
      { error: 'Invalid plan or billing option' },
      { status: 400 }
    );
  }

  const price = PRICE_IDS[planId][billing];
  if (!price) {
    return NextResponse.json(
      { error: 'Price not configured' },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/billing`,
  });

  return NextResponse.json({ url: session.url });
}

