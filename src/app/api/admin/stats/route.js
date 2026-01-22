import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        // 1. Verify Authentication & Admin Role
        const cookies = request.cookies;
        const authSupabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() { return cookies.getAll() },
                    setAll() { }
                }
            }
        );

        const { data: { session }, error: authError } = await authSupabase.auth.getSession();
        if (authError || !session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin/viewer/owner
        const isOwner = session.user.email === 'ibuka.ndjoli@gmail.com';
        const { data: profile } = await authSupabase.from('profiles').select('role').eq('id', session.user.id).single();

        if (!isOwner && profile?.role !== 'admin' && profile?.role !== 'viewer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Fetch Data using SERVICE ROLE (Bypassing RLS)
        // If SUPABASE_SERVICE_ROLE_KEY is missing, we might need a fallback or warn.
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Fetch counts in parallel
        const [
            { count: userCount },
            { count: booksCount },
            { count: purchasedCount },
            { count: clubCount }
        ] = await Promise.all([
            supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('generated_books').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('generated_books').select('*', { count: 'exact', head: true }).eq('is_unlocked', true),
            supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active')
        ]);

        return NextResponse.json({
            users: userCount || 0,
            booksCreated: booksCount || 0,
            booksPurchased: purchasedCount || 0,
            clubMembers: clubCount || 0
        });

    } catch (error) {
        console.error("Admin stats API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
