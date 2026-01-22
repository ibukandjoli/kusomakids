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

        // Fetch counts & Data in parallel
        const [
            { count: userCount },
            { count: booksCount },
            { count: purchasedCount },
            { count: clubCount },
            { data: recentBooks },
            { data: allBooksForTemplates }
        ] = await Promise.all([
            // Counts
            supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('generated_books').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('generated_books').select('*', { count: 'exact', head: true }).eq('is_unlocked', true),
            supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),

            // Recent Activity (Last 5) - Manually join profiles if relation exists, otherwise separate fetch
            supabaseAdmin
                .from('generated_books')
                .select('id, title, created_at, user_id, is_unlocked, cover_image_url')
                .order('created_at', { ascending: false })
                .limit(5),

            // All books (Just IDs and Templates) for Aggregation
            // Note: Limit to 1000 for perf safety, or use pagination if scaling
            supabaseAdmin.from('generated_books').select('template_id').limit(1000)
        ]);

        // Enrich Recent Books with User Names (Manual Join if foreign key not fully trusted or simple)
        let enrichedRecentBooks = [];
        if (recentBooks) {
            const userIds = [...new Set(recentBooks.map(b => b.user_id))];
            const { data: profiles } = await supabaseAdmin.from('profiles').select('id, full_name, email').in('id', userIds);

            enrichedRecentBooks = recentBooks.map(book => {
                const user = profiles?.find(p => p.id === book.user_id);
                return {
                    ...book,
                    user_name: user?.full_name || 'Inconnu',
                    user_email: user?.email || ''
                };
            });
        }

        // Calculate Top Templates
        const templateCounts = {};
        allBooksForTemplates?.forEach(b => {
            const tid = b.template_id || 'Autre';
            templateCounts[tid] = (templateCounts[tid] || 0) + 1;
        });

        // Sort Templates
        const topTemplates = Object.entries(templateCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([id, count]) => ({ id, count }));

        // Resolve Template Names (Optional: You might want a templates map here)
        // For now we send IDs, frontend can map or we map if we have a static list.
        // Let's try to fetch template names if we can, or just return IDs. 
        // Assuming 'templates' table exists? If not, we return IDs.


        return NextResponse.json({
            users: userCount || 0,
            booksCreated: booksCount || 0,
            booksPurchased: purchasedCount || 0,
            clubMembers: clubCount || 0,
            recentBooks: enrichedRecentBooks,
            topTemplates
        });

    } catch (error) {
        console.error("Admin stats API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
