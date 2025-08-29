import { NextRequest, NextResponse } from 'next/server';
import { upgradeUserToPro } from '@/lib/user-tracking';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 503 }
    );
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userFingerprint = session.metadata?.userFingerprint;
      
      if (userFingerprint) {
        console.log('Upgrading user to Pro:', userFingerprint.substring(0, 8));
        upgradeUserToPro(userFingerprint, 1); // 1 month
      }
      break;
      
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      if (invoice.subscription) {
        // Get subscription to access metadata
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const renewalFingerprint = subscription.metadata?.userFingerprint;
        
        if (renewalFingerprint) {
          console.log('Renewing Pro subscription:', renewalFingerprint.substring(0, 8));
          upgradeUserToPro(renewalFingerprint, 1); // Extend by 1 month
        }
      }
      break;
      
    case 'customer.subscription.deleted':
      // Handle subscription cancellation if needed
      console.log('Subscription cancelled');
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}