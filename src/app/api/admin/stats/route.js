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
        let supabaseAdmin;
        let missingKey = false;

        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );
        } else {
            console.warn("Missing SUPABASE_SERVICE_ROLE_KEY. Falling back to auth client (results may be incomplete due to RLS).");
            missingKey = true;
            // Fallback to the authenticated client (which has the admin user's session)
            // If RLS policies are correct (admins can view all), this works.
            // If RLS only allows "own data", this returns 0 for others.
            // WE SHOULD advise user to add the key.
            supabaseAdmin = authSupabase;
        }

        // Fetch counts & Data in parallel
        const [
            { count: userCount },
            { count: booksCount },
            { count: purchasedCount }, // simplified to just count for now to avoid large data transfer
            { count: clubCount },
            { count: totalVisits }, // New: Analytics
            { data: recentBooks },
            { data: allBooksForTemplates }
        ] = await Promise.all([
            // Counts
            supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('generated_books').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('generated_books').select('*', { count: 'exact', head: true }).eq('is_unlocked', true),
            supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),

            // Analytics Count (Total)
            supabaseAdmin.from('analytics_visits').select('*', { count: 'exact', head: true }),

            // Recent Activity (Last 5)
            supabaseAdmin
                .from('generated_books')
                .select('id, title, created_at, user_id, is_unlocked, cover_image_url')
                .order('created_at', { ascending: false })
                .limit(5),

            // All books templates
            supabaseAdmin.from('generated_books').select('template_id').limit(1000)
        ]);

        // --- Visitor Stats Aggregation (Daily/Monthly) ---
        // This is expensive to do on every request. Better to cache or use a materialized view.
        // For now, simpler: Fetch counts grouped by period is hard in standard Supabase API without RPC.
        // We will fetch last 30 days visits and aggregate in JS (assuming traffic isn't massive yet).

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: visitsData } = await supabaseAdmin
            .from('analytics_visits')
            .select('created_at')
            .gte('created_at', thirtyDaysAgo.toISOString());

        const visitsByDay = {};
        visitsData?.forEach(v => {
            const day = v.created_at.split('T')[0];
            visitsByDay[day] = (visitsByDay[day] || 0) + 1;
        });

        // Enrich Recent Books
        let enrichedRecentBooks = [];
        if (recentBooks && recentBooks.length > 0) {
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

        const topTemplates = Object.entries(templateCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([id, count]) => ({ id, count }));

        return NextResponse.json({
            users: userCount || 0,
            booksCreated: booksCount || 0,
            booksPurchased: purchasedCount || 0,
            clubMembers: clubCount || 0,
            totalVisits: totalVisits || 0,
            visitsByDay, // Map of { "YYYY-MM-DD": count }
            recentBooks: enrichedRecentBooks,
            topTemplates,
            warning: missingKey ? "Service Role Key manquante. Les données peuvent être incomplètes." : null
        });

    } catch (error) {
        console.error("Admin stats API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
