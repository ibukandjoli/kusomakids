import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/resend';
import { OrderConfirmationEmail } from '@/lib/emails/OrderConfirmationEmail';
import { WelcomeEmail } from '@/lib/emails/WelcomeEmail';
import { MagicLinkEmail } from '@/lib/emails/MagicLinkEmail';
import { SubscriptionSuccessEmail } from '@/lib/emails/SubscriptionSuccessEmail';
import { SubscriptionFailedEmail } from '@/lib/emails/SubscriptionFailedEmail';
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

    // Handle payment failure
    if (event.type === 'invoice.payment_failed') {
        const invoice = event.data.object;
        try {
            await handleInvoicePaymentFailed(invoice);
        } catch (error) {
            console.error("❌ Error handling invoice failure:", error);
        }
    }

    // Handle subscription cancellation
    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object;
        try {
            await handleSubscriptionDeleted(subscription);
        } catch (error) {
            console.error("❌ Error handling subscription deletion:", error);
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
    const isCreditPurchase = metadata?.type === 'credit_purchase';

    console.log(`📦 Processing Order for User: ${userId}, Book: ${bookId}, Email: ${targetEmail}, Type: ${session.mode}${isCreditPurchase ? ' (CREDIT PURCHASE)' : ''}`);

    // HANDLE CREDIT PURCHASE (early return — no book/subscription logic needed)
    if (isCreditPurchase && userId) {
        const quantity = parseInt(metadata.quantity || '1', 10);
        console.log(`🎫 Credit purchase: ${quantity} credit(s) for user ${userId}`);

        try {
            // Get current credits
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('monthly_credits')
                .eq('id', userId)
                .single();

            const currentCredits = profile?.monthly_credits || 0;

            const { error } = await supabaseAdmin
                .from('profiles')
                .update({ monthly_credits: currentCredits + quantity })
                .eq('id', userId);

            if (error) {
                console.error('❌ Failed to add credits:', error);
            } else {
                console.log(`✅ Added ${quantity} credit(s). New total: ${currentCredits + quantity}`);
            }
        } catch (err) {
            console.error('❌ Credit purchase error:', err);
        }
        return; // Done — no further processing needed
    }

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
            // For guest checkout, ALWAYS send Welcome Email on first purchase
            // This is their introduction to KusomaKids

            // A. WELCOME EMAIL (Ibuka) - Send for ALL guest purchases
            try {
                console.log("📨 Sending Welcome Email (Ibuka) for guest purchase...");
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

            // B. MAGIC LINK - REMOVED (replaced by direct PDF download link)
            // Users now receive a direct download link in the BookReadyEmail instead
            console.log("✅ Skipping Magic Link - using direct download token instead");
        } catch (authError) {
            console.error("❌ Ghost Account Logic Failed:", authError);
        }
    }

    if (bookId && userId) {
        // 1. UNLOCK BOOK & LINK USER
        // Calculate amount paid for this item if possible, or default to standard
        // For subscription checkout, it might be 0 immediately for the book? 
        // Usually single purchase is 'payment' mode.
        const amountPaid = session.amount_total ? session.amount_total / 100 : 3000; // rough fallback if needed, but session.amount_total is accurate

        const { error: updateError } = await supabaseAdmin
            .from('generated_books')
            .update({
                is_unlocked: true,
                pdf_unlocked: true, // Purchase unlocks PDF download
                user_id: userId, // Ensure ownership is transferred/set to the real user
                purchase_type: 'stripe',
                purchase_amount: amountPaid
            })
            .eq('id', bookId);

        if (updateError) {
            console.error("❌ Failed to unlock book in DB:", updateError);
        } else {
            console.log("✅ Book unlocked successfully in DB.");

            // 1.5 SEND ORDER CONFIRMATION EMAIL (Immediate)
            if (targetEmail) {
                try {
                    console.log(`📧 Sending order confirmation to ${targetEmail}...`);
                    const confirmEmailRes = await sendEmail({
                        to: targetEmail,
                        from: SENDERS.TREASURE,
                        subject: "Commande confirmée ! Votre histoire arrive... ✨",
                        html: OrderConfirmationEmail({
                            childName: childName,
                            bookTitle: bookTitle,
                            userEmail: targetEmail
                        })
                    });
                    if (!confirmEmailRes.success) {
                        console.error("❌ Confirmation Email Failed:", confirmEmailRes.error);
                    } else {
                        console.log("📨 Order Confirmation Email sent successfully.");
                    }
                } catch (emailErr) {
                    console.error("❌ Confirmation Email Exception:", emailErr);
                }
            }

            // 2. TRIGGER GENERATION (New System with Status Tracking)
            try {
                console.log(`🎨 Triggering image generation for book ${bookId}...`);

                const triggerUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://kusomakids.com'}/api/admin/trigger-generation`;

                // Call the new trigger endpoint (it will handle everything synchronously)
                const response = await fetch(triggerUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-webhook-source': 'stripe'
                    },
                    body: JSON.stringify({ bookId })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    console.log(`✅ Generation completed: ${result.generatedCount} images`);
                } else {
                    console.error(`❌ Generation failed:`, result.error || result);
                    // Book status will be 'failed' in DB, can be retried manually
                }
            } catch (e) {
                console.error("❌ Generation Trigger Error:", e.message);
                // Book status will remain 'pending', can be retried manually
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
                    monthly_credits: 1,
                    subscription_started_at: new Date().toISOString(),
                    stripe_customer_id: session.customer // Store for billing portal
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
        const userEmail = invoice.customer_email || subscription.customer_email; // Fallback

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

            // Send Renewal Success Email
            if (userEmail) {
                try {
                    const nextBillingDate = new Date(subscription.current_period_end * 1000).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    });

                    await sendEmail({
                        to: userEmail,
                        from: SENDERS.WELCOME, // Using Welcome sender for relationship building
                        subject: "🎉 Votre abonnement Club Kusoma est renouvelé !",
                        html: SubscriptionSuccessEmail({
                            userName: subscription.metadata?.childName || 'Membre du Club',
                            nextBillingDate
                        })
                    });
                    console.log(`📨 Renewal success email sent to ${userEmail}`);
                } catch (e) {
                    console.error("❌ Renewal email failed:", e);
                }
            }
        }
    } catch (err) {
        console.error("❌ Error processing invoice:", err);
    }
}

async function handleInvoicePaymentFailed(invoice) {
    if (!invoice.subscription) return;

    try {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const userId = subscription.metadata?.userId;
        const userEmail = invoice.customer_email || subscription.customer_email;

        if (!userId) {
            console.error("❌ No userId in failed subscription metadata");
            return;
        }

        console.log(`⚠️ Handling payment failure for user: ${userId}`);

        // Update status to past_due
        await supabaseAdmin
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('id', userId);

        // Send Failure Email
        if (userEmail) {
            await sendEmail({
                to: userEmail,
                from: SENDERS.SUPPORT,
                subject: "⚠️ Action requise : Problème avec votre abonnement Kusoma",
                html: SubscriptionFailedEmail({
                    userName: subscription.metadata?.childName || 'Membre du Club',
                    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile`
                })
            });
            console.log(`📨 Payment failed email sent to ${userEmail}`);
        }

    } catch (err) {
        console.error("❌ Error handling payment failure:", err);
    }
}

async function handleSubscriptionDeleted(subscription) {
    const userId = subscription.metadata?.userId;

    if (!userId) {
        console.error("❌ No userId in canceled subscription metadata");
        return;
    }

    console.log(`🚫 Handling subscription cancellation for user: ${userId}`);

    try {
        await supabaseAdmin
            .from('profiles')
            .update({
                subscription_status: 'canceled',
                monthly_credits: 0 // Optional: remove credits on cancel? Or keep until period end?
                // Keeping credits might be better UX, but 'canceled' usually means immediate effect or end of period.
                // If stripe event is 'deleted', it's usually final.
            })
            .eq('id', userId);

        console.log("✅ User profile updated to 'canceled'");

    } catch (err) {
        console.error("❌ Error handling subscription cancellation:", err);
    }
}
