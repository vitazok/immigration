// Stripe webhook — skeleton for post-MVP payment integration
// Full implementation: add checkout session, subscription management, etc.

import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json(
      { error: { code: 'MISSING_SIGNATURE', message: 'Missing Stripe signature' } },
      { status: 400 }
    );
  }

  // TODO (post-MVP): Verify webhook signature and handle events
  // const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  // const event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  // switch (event.type) {
  //   case 'checkout.session.completed': ...
  //   case 'customer.subscription.deleted': ...
  // }

  console.log('[stripe/webhook] Received event (skeleton — not yet processed)');

  return NextResponse.json({ received: true });
}
