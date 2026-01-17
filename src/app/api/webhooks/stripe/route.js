import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/resend';
import { BookReadyEmail } from '@/lib/emails/BookReadyEmail';
import { WelcomeEmail } from '@/lib/emails/WelcomeEmail';
import { MagicLinkEmail } from '@/lib/emails/MagicLinkEmail';
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

    // Handle monthly subscription renewal
    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object;
        try {
            await handleInvoicePaymentSucceeded(invoice);
        } catch (error) {
            console.error("❌ Error handling invoice payment:", error);
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
    // Extract Metadata for Emails
    const childName = metadata?.childName || customer_details?.name || 'votre enfant';

    // Fetch Real Book Title
    let bookTitle = "Aventure Magique";
    if (bookId) {
        const { data: bookData } = await supabaseAdmin
            .from('generated_books')
            .select('title')
            .eq('id', bookId)
            .single();
        if (bookData?.title) {
            bookTitle = bookData.title.replace(/\{childName\}/gi, childName);
        }
    }

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
            }

            // --- SEND EMAILS (WELCOME / MAGIC LINK) ---
            // Send only if it's a "guest" checkout flow, even if user existed.
            // But be careful not to spam. Magic Link is always useful for access.
            // Welcome email might only be for NEW users?
            // The user requested: "received confirmation... but not welcome/magic link"
            // Let's send Magic Link ALWAYS for guest checkout so they can login.
            // Let's send Welcome only if NEW user? or just send it?
            // User said "ni le mail de bienvenue... ni celui de livraison".
            // Let's send both to be safe, or check a flag.

            // For now, let's just make sure the Magic Link is sent.

            // 2.5 Send Welcome Email (Only if NEW user ideally, but for now specific request implies they want it)
            // Actually, if existingUser found, they might have already got Welcome before.
            // But if they are complaining they didn't get it...

            if (!existingUser) {
                try {
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
                } catch (e) { console.error("Welcome Email Error", e); }
            }

            // B. MAGIC LINK (Treasure) - ALWAYS SEND for Guest Checkout flow
            try {
                console.log("🔑 Generating Magic Link for", targetEmail);
                const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                    type: 'magiclink',
                    email: targetEmail,
                    options: {
                        redirectTo: 'https://www.kusomakids.com/dashboard/purchased'
                    }
                });

                if (linkData && linkData.properties?.action_link) {
                    const emailRes = await sendEmail({
                        to: targetEmail,
                        from: SENDERS.TREASURE,
                        subject: "Accédez à votre histoire KusomaKids ! 🗝️",
                        html: MagicLinkEmail({ magicLink: linkData.properties.action_link })
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

            // 1.5 SEND PURCHASE EMAIL (+ Magic Link for Auto-Login/Download)
            if (targetEmail) {
                // GENERATE MAGIC LINK FOR "DOWNLOAD" BUTTON
                let magicLinkUrl = 'https://www.kusomakids.com/login';
                try {
                    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
                        type: 'magiclink',
                        email: targetEmail,
                        options: { redirectTo: 'https://www.kusomakids.com/dashboard/purchased' }
                    });
                    if (linkData?.properties?.action_link) {
                        magicLinkUrl = linkData.properties.action_link;
                    }
                } catch (e) { console.error("Error generating purchase action link:", e); }

                try {
                    console.log(`📧 Sending purchase confirmation to ${targetEmail}...`);
                    const purEmailRes = await sendEmail({
                        to: targetEmail,
                        from: SENDERS.TREASURE,
                        subject: "Votre commande KusomaKids est confirmée ! 🌟",
                        html: BookReadyEmail({
                            childName: childName,
                            bookTitle: bookTitle,
                            previewUrl: magicLinkUrl // User clicks "Download" -> Magic Login -> Redirect to PDFs
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
        console.log("🏆 New Club Member! User ID:", userId);

        try {
            // Update profile with subscription status and grant monthly credit
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({
                    subscription_status: 'active',
                    monthly_credits: 1, // 1 free PDF download per month
                    subscription_started_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (profileError) {
                console.error("❌ Failed to update subscription status:", profileError);
            } else {
                console.log("✅ Subscription activated with 1 monthly credit");
            }

            // Send welcome email for club members
            if (targetEmail) {
                try {
                    const welcomeHtml = WelcomeEmail({
                        userName: customer_details?.name || 'Membre du Club'
                    });
                    await sendEmail({
                        to: targetEmail,
                        from: SENDERS.WELCOME,
                        subject: "🎉 Bienvenue au Club Kusoma !",
                        html: welcomeHtml
                    });
                    console.log("📨 Club welcome email sent");
                } catch (e) {
                    console.error("Club welcome email error:", e);
                }
            }
        } catch (err) {
            console.error("❌ Subscription handling error:", err);
        }
    }
}

// Handle monthly subscription renewal
async function handleInvoicePaymentSucceeded(invoice) {
    // Only process subscription invoices (not one-time payments)
    if (!invoice.subscription) {
        console.log("⏭️ Skipping non-subscription invoice");
        return;
    }
    
    try {
        // Retrieve subscription to get metadata
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const userId = subscription.metadata?.userId;

        if (!userId) {
            console.error("❌ No userId in subscription metadata");
            return;
        }

        console.log(`🔄 Processing subscription renewal for user: ${userId}`);

        // Reset monthly credits to 1
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ 
                monthly_credits: 1,
                subscription_status: 'active'
            })
            .eq('id', userId);

        if (error) {
            console.error("❌ Failed to reset monthly credits:", error);
        } else {
            console.log("✅ Monthly credits reset to 1 for user:", userId);
        }
    } catch (err) {
        console.error("❌ Error processing invoice:", err);
    }
}
