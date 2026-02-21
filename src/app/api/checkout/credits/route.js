import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    try {
        const { userId, email, quantity = 1 } = await req.json();

        if (!userId || !email) {
            return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
        }

        const qty = Math.max(1, Math.min(10, Number(quantity))); // Clamp 1-10
        const unitPrice = 1500; // 1500 FCFA per credit

        const origin = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || 'https://kusomakids.com';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: email,
            line_items: [
                {
                    price_data: {
                        currency: 'xof',
                        product_data: {
                            name: `${qty} Crédit${qty > 1 ? 's' : ''} PDF KusomaKids`,
                            description: `Débloquez ${qty} PDF${qty > 1 ? 's' : ''} de vos histoires personnalisées`,
                        },
                        unit_amount: unitPrice,
                    },
                    quantity: qty,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/dashboard/billing?credit_success=true&qty=${qty}`,
            cancel_url: `${origin}/dashboard/billing?canceled=true`,
            metadata: {
                userId,
                type: 'credit_purchase',
                quantity: String(qty),
            },
        });

        return NextResponse.json({ url: session.url });

    } catch (error) {
        console.error("Stripe Credit Purchase Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
