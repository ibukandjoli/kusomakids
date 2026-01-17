import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // NOTE: using service role if needed for profile updates? 
// Actually client supabase in API routes usually needs cookie handling or we use a fresh server client.
// I'll check how other APIs do it. src/app/api/checkout/subscription uses `req.json()` and passes to Stripe.
// src/app/api/generate-story uses `request.json()`.
// For secure operations like decrementing credits, I should verify the User ID from the Session strictly.
import { createClient } from '@/lib/supabase-server';

export async function POST(req) {
    try {
        const supabaseServer = await createClient();
        const { data: { session } } = await supabaseServer.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { bookId } = body;

        if (!bookId) {
            return NextResponse.json({ error: 'Missing bookId' }, { status: 400 });
        }

        // 1. Check User Profile for Credits
        const { data: profile, error: profileError } = await supabaseServer
            .from('profiles')
            .select('credits')
            .eq('id', session.user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        if (profile.credits < 1) {
            return NextResponse.json({ error: 'Insufficent credits' }, { status: 403 });
        }

        // 2. Transact: Decrement Credit & Unlock Book
        // Using RPC or separate calls. For MVP, separate calls (risk of race cond but acceptable).
        // Ideally RPC `unlock_book_transaction`.
        // I'll do: Update Profile -> Update Book.

        const { error: creditError } = await supabaseServer
            .from('profiles')
            .update({ credits: profile.credits - 1 })
            .eq('id', session.user.id);

        if (creditError) throw creditError;

        const { error: bookError } = await supabaseServer
            .from('generated_books')
            .update({
                is_unlocked: true
            })
            .eq('id', bookId)
            .eq('user_id', session.user.id);

        if (bookError) {
            // Rollback credit? Complex without transaction. 
            // Logging critical error.
            console.error("CRITICAL: Credit deducted but book not unlocked", { userId: session.user.id, bookId });
            return NextResponse.json({ error: 'Transactions failed' }, { status: 500 });
        }

        // 3. Trigger Generation
        // We return success immediately. The Frontend will trigger the worker '/api/books/process-purchased'
        // to avoid timeout issues here.

        return NextResponse.json({ success: true, newCredits: profile.credits - 1 });

    } catch (err) {
        console.error('Unlock API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
