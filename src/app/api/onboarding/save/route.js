import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Admin client bypasses RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(request) {
    try {
        // 1. Verify user is authenticated (using SSR client)
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        // 2. Parse body
        const { role, children, interests } = await request.json();

        if (!role || !children || !Array.isArray(children) || children.length === 0) {
            return NextResponse.json({ error: 'Données incomplètes' }, { status: 400 });
        }

        // 3. Upsert Profile (bypasses RLS via service_role)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: user.id,
                role: role,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Parent',
                onboarding_completed: true,
            }, { onConflict: 'id' });

        if (profileError) {
            console.error('❌ Profile upsert error:', profileError);
            return NextResponse.json({ error: 'Erreur profil: ' + profileError.message }, { status: 500 });
        }

        // 4. Insert Children (bypasses RLS via service_role)
        const childrenData = children.map(child => ({
            user_id: user.id,
            first_name: child.firstName,
            birth_date: child.birthDate || null,
            gender: child.gender || 'girl',
            interests: interests || [],
        }));

        const { error: childrenError } = await supabaseAdmin
            .from('children')
            .insert(childrenData);

        if (childrenError) {
            console.error('❌ Children insert error:', childrenError);
            return NextResponse.json({ error: 'Erreur enfants: ' + childrenError.message }, { status: 500 });
        }

        console.log(`✅ Onboarding completed for user ${user.id}`);
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('❌ Onboarding API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
