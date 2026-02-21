import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Get user's stripe_customer_id from profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('stripe_customer_id, email')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        let customerId = profile.stripe_customer_id;

        // If no customer ID stored, try to find by email
        if (!customerId && profile.email) {
            const customers = await stripe.customers.list({ email: profile.email, limit: 1 });
            if (customers.data.length > 0) {
                customerId = customers.data[0].id;
                // Save for future use
                await supabaseAdmin
                    .from('profiles')
                    .update({ stripe_customer_id: customerId })
                    .eq('id', userId);
            }
        }

        if (!customerId) {
            return NextResponse.json({ error: 'No Stripe customer found for this account' }, { status: 404 });
        }

        // Create Stripe Customer Portal session
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
        });

        return NextResponse.json({ url: portalSession.url });

    } catch (err) {
        console.error('Billing Portal Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
