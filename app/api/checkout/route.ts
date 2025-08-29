import { NextRequest, NextResponse } from 'next/server';
import { generateRobustFingerprint } from '@/lib/robust-fingerprint';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
  try {
    // Get client fingerprint data
    const body = await request.json().catch(() => ({}));
    const clientFingerprint = body.fingerprint;
    
    // Generate fingerprint to identify user after payment
    const userFingerprint = generateRobustFingerprint(request, clientFingerprint);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'ShotPack Pro',
              description: 'Unlimited HD product photo packs',
              images: ['https://shotpack.ai/favicon.svg'],
            },
            unit_amount: 700, // $7.00
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
      metadata: {
        userFingerprint: userFingerprint,
      },
      subscription_data: {
        metadata: {
          userFingerprint: userFingerprint,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}