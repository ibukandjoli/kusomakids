import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    try {
        const body = await req.json();
        const { userId, email, bookId, amount } = body;

        if (!userId || !email || !bookId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Convert amount to currency unit (Euro cents for Stripe or XOF)
        // Stripe requires integer amounts. 
        // 3000 XOF ~= 4.57 EUR. 
        // If using XOF directly (requires Stripe account support), ensure amount is integer.
        // If using EUR, 3000 FCFA is approx 4.57 EUR -> 457 cents. 
        // Ideally we pass a priceId for a product called "Single Story".
        // Or we create a one-time price on the fly using `price_data`.

        // Using `price_data` for ad-hoc amount or predefined product.
        // Let's assume we charge in EUR for simplicity if XOF is tricky, or use XOF if account supports it.
        // Let's stick to XOF if possible, or convert to EUR equivalent (~4.99 EUR or similar).
        // User asked for 3000 FCFA. Let's try to use XOF.

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'xof',
                        product_data: {
                            name: 'Histoire Magique (Achat Unique)',
                            description: 'Débloquez le PDF et la lecture de cette histoire.',
                            images: ['https://kusomakids.com/logo.png'], // Replace with actual
                        },
                        unit_amount: 3000, // 3000 XOF (Stripe handles 0-decimal currencies differently, XOF is usually zero-decimal so 3000 = 3000)
                        // CHECK: XOF is a zero-decimal currency? Stripe says: "For zero-decimal currencies, the amount should be passed as an integer."
                        // XOF is zero-decimal. So 3000 means 3000 XOF.
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.headers.get('origin')}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}&book_id=${bookId}`,
            cancel_url: `${req.headers.get('origin')}/dashboard`,
            customer_email: email,
            metadata: {
                userId: userId,
                bookId: bookId,
                type: 'one_time'
            },
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (err) {
        console.error('Stripe One-Time Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
