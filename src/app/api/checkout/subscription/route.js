import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    try {
        const body = await req.json();
        const { userId, email, priceId } = body; // priceId from frontend config

        if (!userId || !email) {
            return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID || priceId,
                    quantity: 1,
                },
            ],
            success_url: `${req.headers.get('origin')}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.get('origin')}/onboarding`,
            customer_email: email,
            metadata: {
                userId: userId,
            },
            subscription_data: {
                metadata: {
                    userId: userId
                }
            }
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (err) {
        console.error('Stripe Endpoint Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
