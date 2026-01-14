import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    try {
        const body = await req.json();
        const { userId, email, bookId, childName, bookTitle, coverUrl } = body;

        console.log(`💳 Creating Stripe Session for Book: ${bookTitle}`);

        const origin = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || 'https://kusomakids.com';

        // Create Stripe Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: email,
            line_items: [
                {
                    price_data: {
                        currency: 'xof', // FCFA
                        product_data: {
                            name: `Histoire: ${bookTitle || 'Histoire Personnalisée'}`,
                            description: `Pour ${childName || 'votre enfant'}`,
                            images: coverUrl ? [coverUrl] : [],
                        },
                        unit_amount: 3000, // 3000 FCFA
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout?canceled=true`,
            metadata: {
                userId: userId || 'guest',
                bookId: bookId,
                childName: childName,
                type: 'book_purchase'
            },
        });

        return NextResponse.json({ url: session.url });

    } catch (error) {
        console.error("Stripe Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
