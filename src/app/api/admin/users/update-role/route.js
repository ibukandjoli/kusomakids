import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        // 1. Auth Check
        const cookies = request.cookies;
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() { return cookies.getAll() },
                    setAll() { }
                }
            }
        );

        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Permission Check: Admin only
        const isOwner = session.user.email === 'ibuka.ndjoli@gmail.com';
        const { data: requesterProfile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (profileError || (!isOwner && requesterProfile?.role !== 'admin')) {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
        }

        // 3. Validate Input
        const body = await request.json();
        const { userId, newRole } = body;

        if (!userId || !['user', 'admin', 'viewer'].includes(newRole)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        // 4. Update using Service Role (bypasses RLS that blocks role changes)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { error: updateError } = await supabaseAdmin
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
