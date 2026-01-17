import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/resend';
import { BookReadyEmail } from '@/lib/emails/BookReadyEmail';
import { WelcomeEmail } from '@/lib/emails/WelcomeEmail';
import { SENDERS } from '@/lib/senders';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Initialize Admin Client for Ghost Account Creation
const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(req) {
    const body = await req.text();
    const sig = (await headers()).get('stripe-signature');

    let event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
        console.error(`❌ Webhook signature verification failed.`, err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        try {
            await handleCheckoutSessionCompleted(session);
        } catch (error) {
            console.error("❌ Error handling checkout session:", error);
            // We return 200 to acknowledge receipt to Stripe, but log the error
        }
    }

    return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session) {
    const { metadata, customer_email, customer_details } = session;
    // Fallback to customer_details.email if customer_email is null
    const targetEmail = customer_email || customer_details?.email;

    let userId = metadata?.userId;
    const bookId = metadata?.bookId || metadata?.target_book_id;
    // Extract Metadata for Emails
    const childName = metadata?.childName || customer_details?.name || 'votre enfant';
    const bookTitle = "Aventure Magique"; // If dynamic titles exist later, fetch from DB

    const isSubscription = session.mode === 'subscription';

    console.log(`📦 Processing Order for User: ${userId}, Book: ${bookId}, Email: ${targetEmail}, Type: ${session.mode}`);

    if (!targetEmail) {
        console.error("❌ CRITICAL: No email found in Stripe Session. Cannot fulfill order.");
    }

    // --- GHOST ACCOUNT LOGIC ---
    // If Guest Checkout (userId is 'guest' or missing), utilize Email to find/create user
    if ((!userId || userId === 'guest') && targetEmail) {
        console.log(`👻 Guest Checkout detected for ${targetEmail}. checking/creating account...`);
        try {
            // 1. Check if user exists
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = users?.find(u => u.email === targetEmail);

            if (existingUser) {
                console.log(`👤 User already exists: ${existingUser.id}`);
                userId = existingUser.id;
            } else {
                console.log(`🆕 Creating Ghost Account for ${targetEmail}...`);
                // 2. Create User
                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email: targetEmail,
                    email_confirm: true,
                    user_metadata: { full_name: customer_details?.name || 'Parent Kusoma' }
                });

                if (createError) throw createError;
                userId = newUser.user.id;
                console.log(`✨ Ghost Account Created: ${userId}`);

                // 2.5 Send Welcome/OTP Email
                try {
                    // A. WELCOME EMAIL (Ibuka)
                    console.log("📨 Sending Welcome Email (Ibuka)...");
                    // A. WELCOME EMAIL (Ibuka)
                    console.log("📨 Sending Welcome Email (Ibuka)...");
                    const welcomeHtml = WelcomeEmail({ userName: customer_details?.name || 'Parent' });
                    const welcomeRes = await sendEmail({
                        to: targetEmail,
                        from: SENDERS.WELCOME,
                        subject: "🎉 Bienvenue dans la famille KusomaKids ! (Un petit mot du papa de Soraya)",
                        html: welcomeHtml
                    });

                    if (welcomeRes.success) {
                        console.log("✅ Welcome Email sent successfully.");
                    } else {
                        console.error("❌ Welcome Email Failed:", welcomeRes.error);
                    }

                    // B. MAGIC LINK (Treasure)
                    console.log("🔑 Generating Magic Link...");
                    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                        type: 'magiclink',
                        email: targetEmail,
                        options: {
                            redirectTo: 'https://www.kusomakids.com/dashboard'
                        }
                    });

                    if (linkData && linkData.properties?.action_link) {
                        const emailRes = await sendEmail({
                            to: targetEmail,
                            from: SENDERS.TREASURE,
                            subject: "Accédez à votre histoire KusomaKids ! 🗝️",
                            html: `<p>Votre commande est validée !</p><p>Pour accéder à votre histoire, cliquez sur ce lien magique : <a href="${linkData.properties.action_link}">Accéder à mon compte</a></p>`
                        });

                        if (!emailRes.success) {
                            console.error("❌ Magic Link Email Failed:", emailRes.error);
                        } else {
                            console.log("📨 Magic Link sent successfully.");
                        }
                    }
                } catch (linkErr) {
                    console.error("Failed to generate/send magic link:", linkErr);
                }
            }
        } catch (authError) {
            console.error("❌ Ghost Account Logic Failed:", authError);
        }
    }

    if (bookId && userId) {
        // 1. UNLOCK BOOK & LINK USER
        const updates = {
            is_unlocked: true,
            user_id: userId // Ensure ownership is transferred/set to the real user
        };

        const { error: unlockError } = await supabaseAdmin
            .from('generated_books')
            .update(updates)
            .eq('id', bookId);

        if (unlockError) {
            console.error("❌ Failed to unlock book:", unlockError);
        } else {
            console.log("✅ Book Unlocked & Linked in DB");

            // 1.5 SEND PURCHASE EMAIL
            if (targetEmail) {
                try {
                    console.log(`📧 Sending purchase confirmation to ${targetEmail}...`);
                    const purEmailRes = await sendEmail({
                        to: targetEmail,
                        from: SENDERS.TREASURE,
                        subject: "Votre commande KusomaKids est confirmée ! 🌟",
                        html: BookReadyEmail({
                            childName: childName,
                            bookTitle: bookTitle,
                            previewUrl: `https://www.kusomakids.com/dashboard/purchased`
                        })
                    });
                    if (!purEmailRes.success) {
                        console.error("❌ Purchase Email Failed:", purEmailRes.error);
                    } else {
                        console.log("📨 Purchase Email sent successfully.");
                    }
                } catch (emailErr) {
                    console.error("❌ Purchase Email Exception:", emailErr);
                }
            }

            // 2. TRIGGER GENERATION WORKER
            try {
                const workerUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://kusomakids.com'}/api/workers/generate-book`;
                fetch(workerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bookId: bookId })
                }).catch(err => console.error("Worker Catch:", err));
            } catch (e) {
                console.error("Worker Trigger Error:", e);
            }
        }
    } else {
        console.error(`❌ Skipped Unlock: Missing bookId (${bookId}) or valid userId (${userId})`);
    }

    // 3. HANDLE SUBSCRIPTION (CLUB MEMBER)
    if (isSubscription && userId) {
        // ... existing subscription logic ...
        console.log("🏆 New Club Member! User ID:", userId);
    }
}
