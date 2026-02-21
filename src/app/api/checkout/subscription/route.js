import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    try {
        const body = await req.json();
        const { userId, email, priceId, target_book_id } = body; // priceId from frontend config

        if (!userId || !email) {
            return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
        }

        const successUrl = target_book_id
            ? `${req.headers.get('origin')}/dashboard?action=club_welcome&unlock_book=${target_book_id}&session_id={CHECKOUT_SESSION_ID}`
            : `${req.headers.get('origin')}/dashboard?action=club_welcome&session_id={CHECKOUT_SESSION_ID}`;

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID || priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: `${req.headers.get('origin')}/dashboard`,
            customer_email: email,
            metadata: {
                userId: userId,
                target_book_id: target_book_id || ''
            },
            subscription_data: {
                metadata: {
                    userId: userId,
                    target_book_id: target_book_id || ''
                }
            }
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (err) {
        console.error('Stripe Endpoint Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
