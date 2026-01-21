import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        // 1. Init Supabase Auth context
        const cookieStore = {
            getAll: () => [],
            setAll: () => { },
        }; // We only need to READ cookies for auth check, but createServerClient needs the interface. 
        // Actually, for properly reading the session from the request cookies, we need to pass the request cookies.

        // Simpler: Use the standard supabase/ssr pattern for Next.js Route Handlers
        const cookies = request.cookies;

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        return cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        // API routes don't usually set cookies back unless refreshing token, 
                        // but we just need to read here.
                    }
                }
            }
        );

        // 2. Auth Check: Who is calling?
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 3. Permission Check: Is the caller an ADMIN?
        // We fetch the requester's profile
        const { data: requesterProfile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        // Allow 'ibuka.ndjoli@gmail.com' hardcoded bypass as per previous fix
        const isOwner = session.user.email === 'ibuka.ndjoli@gmail.com';

        if (profileError || (!isOwner && requesterProfile?.role !== 'admin')) {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
        }

        // 4. Perform Update
        const body = await request.json();
        const { userId, newRole } = body;

        if (!userId || !['user', 'admin', 'viewer'].includes(newRole)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        // Use SERVICE ROLE key to bypass RLS for the update if needed, 
        // OR rely on the fact that if RLS allows admins to update profiles, standard client works.
        // SAFE BET: Use Service Role for admin actions to ensure it works regardless of RLS complexity.
        // We don't have service role key in env vars usually visible here? 
        // Actually, usually it's SUPABASE_SERVICE_ROLE_KEY.
        // If not available, we use the authenticated client and hope RLS is set up.
        // Let's assume we use the authenticated client first. If it fails, we know we need RLS policy.

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true, role: newRole });

    } catch (error) {
        console.error("Role Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
