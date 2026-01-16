import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase-server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

import { sendEmail } from '@/lib/resend';
import { BookReadyEmail } from '@/lib/emails/BookReadyEmail'; // Reuse or Create new
import { SENDERS } from '@/lib/senders';

export async function POST(req) {
    const body = await req.text();
    const sig = headers().get('stripe-signature');

    let event;

    try {
        if (!sig || !endpointSecret) {
            console.error("⚠️ Missing Stripe Signature or Webhook Secret");
            return NextResponse.json({ error: "Configuration Error" }, { status: 400 });
        }
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
        console.error(`❌ Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const supabase = await createClient();

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log(`💰 Checkout Session Completed: ${session.id}`);

            await handleCheckoutSessionCompleted(session, supabase);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session, supabase) {
    const { metadata, customer_email } = session;
    const userId = metadata?.userId;

    // Determine Book ID (Club uses 'target_book_id', One-Time uses 'bookId')
    const bookId = metadata?.bookId || metadata?.target_book_id;
    const isSubscription = session.mode === 'subscription';

    console.log(`📦 Processing Order for User: ${userId}, Book: ${bookId}, Type: ${session.mode}`);

    if (bookId) {
        // 1. UNLOCK BOOK
        const { error: unlockError } = await supabase
            .from('generated_books')
            .update({ is_unlocked: true, status: 'paid' }) // Ensure status reflects payment
            .eq('id', bookId);

        if (unlockError) {
            console.error("❌ Failed to unlock book:", unlockError);
        } else {
            console.log("✅ Book Unlocked in DB");

            // 1.5 SEND PURCHASE EMAIL
            if (customer_email) {
                try {
                    console.log(`📧 Sending purchase confirmation to ${customer_email}...`);
                    await sendEmail({
                        to: customer_email,
                        from: SENDERS.TREASURE,
                        subject: "Votre commande KusomaKids est confirmée ! 🌟",
                        html: BookReadyEmail({
                            childName: "votre enfant", // We might not have metadata here easily without DB fetch, keep generic
                            bookTitle: "Aventure Magique",
                            previewUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kusomakids.com'}/dashboard`
                        })
                    });
                } catch (emailErr) {
                    console.error("❌ Purchase Email Failed:", emailErr);
                }
            }

            // 2. TRIGGER GENERATION WORKER (Redundancy)
            // We call our own API worker to ensure pages 3-10 are generated
            try {
                const workerUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://kusomakids.com'}/api/workers/generate-book`;

                // Fire and forget fetch
                fetch(workerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bookId: bookId })
                }).catch(err => console.error("Worker Trigger Error (Webhook):", err));

                console.log("🚀 Generation Worker Triggered from Webhook");
            } catch (e) {
                console.error("Failed to trigger worker from webhook:", e);
            }
        }
    }

    // 3. HANDLE SUBSCRIPTION (CLUB MEMBER)
    if (isSubscription && userId) {
        // Update user profile or metadata
        // Assuming we have a 'profiles' table or we update auth.users metadata (cant do via client easily)
        // Let's assume we update a 'subscription_status' in a 'profiles' table if it exists, or just log for now.
        console.log("🏆 New Club Member! User ID:", userId);

        // Example: Update Supabase public.profiles if exists
        /*
        await supabase
            .from('profiles')
            .update({ is_club_member: true, stripe_customer_id: session.customer })
            .eq('id', userId);
        */
    }
}
