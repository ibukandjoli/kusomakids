import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(req, { params }) {
    try {
        const { bookId } = await params;

        // 1. Authenticate User
        const { createClient } = require('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        const authHeader = req.headers.get('cookie');
        // NOTE: In a perfect world we verify the session. 
        // But for "get-token" called from client component, we rely on Supabase Auth cookie or header.
        // Let's us use the standard server client helpers if available, OR just trust the user ID passed?
        // No, must be secure.

        // We will use the 'authorization' header if sent, or try to get session from cookie.
        // For simplicity in this route handlers without full Next.js middleware context:
        // We'll trust the client to include the session cookie, but we need to validate it.
        // Actually, let's use the helper to get the user.

        const { createServerClient } = require('@supabase/ssr');
        const cookieStore = {
            getAll() { return parseCookies(req.headers.get('cookie') || ''); },
            setAll() { }
        };

        const supabaseAuth = createServerClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
            cookies: cookieStore
        });

        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch Book & Profile status
        const { data: book, error: bookError } = await supabaseAdmin
            .from('generated_books')
            .select('pdf_unlocked, user_id, title')
            .eq('id', bookId)
            .single();

        if (bookError || !book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        // Security: Ensure user owns the book
        if (book.user_id !== user.id) {
            // Exception: Admin
            const isOwner = user.email === 'ibuka.ndjoli@gmail.com';
            if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Check Logic
        let shouldDeductCredit = false;

        if (book.pdf_unlocked) {
            // Already unlocked, free token
            shouldDeductCredit = false;
        } else {
            // Locked - Check Credits
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('monthly_credits')
                .eq('id', user.id)
                .single();

            const credits = profile?.monthly_credits || 0;

            if (credits > 0) {
                shouldDeductCredit = true;
            } else {
                return NextResponse.json({
                    error: 'Credits exhausted',
                    code: 'NO_CREDITS'
                }, { status: 402 });
            }
        }

        // 4. Update DB if needed
        if (shouldDeductCredit) {
            // Decrement credit AND Unlock PDF
            const { error: updateError } = await supabaseAdmin.rpc('decrement_credit_and_unlock', {
                p_user_id: user.id,
                p_book_id: bookId
            });

            // Fallback if RPC doesn't exist (I will write it inline)
            if (updateError) {
                // Manual transaction attempt
                const { data: profile } = await supabaseAdmin.from('profiles').select('monthly_credits').eq('id', user.id).single();
                if ((profile?.monthly_credits || 0) <= 0) return NextResponse.json({ error: 'Credits exhausted' }, { status: 402 });

                await supabaseAdmin.from('profiles').update({ monthly_credits: (profile.monthly_credits - 1) }).eq('id', user.id);
                await supabaseAdmin.from('generated_books').update({ pdf_unlocked: true }).eq('id', bookId);
            }
        }

        // 5. Generate Token
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');

        const { error: tokenError } = await supabaseAdmin
            .from('download_tokens')
            .insert({
                book_id: bookId,
                token: token,
                email: user.email || 'user',
                downloads_remaining: 5, // 5 attempts per fetch
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h link
            });

        if (tokenError) throw tokenError;

        return NextResponse.json({ token, deducted: shouldDeductCredit });

    } catch (error) {
        console.error('Get token error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// Helper for cookies
function parseCookies(cookieHeader) {
    const list = {};
    if (!cookieHeader) return [];

    // Quick parse to array of objects expected by ssr
    return cookieHeader.split(';').map(v => {
        const parts = v.split('=');
        return { name: parts[0]?.trim(), value: parts[1]?.trim() };
    });
}
