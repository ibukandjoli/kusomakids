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

export async function POST(req) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email et mot de passe requis' },
                { status: 400 }
            );
        }

        console.log(`🔐 Setting password for ghost account: ${email}`);

        // Update user password using admin API
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users.users?.find(u => u.email === email);

        if (!user) {
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 404 }
            );
        }

        // Set password for the user
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { password: password }
        );

        if (error) {
            console.error('❌ Password update error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        console.log('✅ Password set successfully for:', email);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('❌ Set password API error:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
