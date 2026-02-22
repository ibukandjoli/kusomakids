import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Reward definitions: badge_id -> credits granted
const REWARDS = {
    ten_books: { threshold: 10, credits: 2, label: 'Maître des Mondes' },
    fifteen_books: { threshold: 15, credits: 1, label: 'Gardien des Légendes' },
    twentyfive_books: { threshold: 25, credits: 5, label: 'Étoile de Kusoma' },
};

export async function POST(request) {
    try {
        // 1. Verify authentication
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

        const { rewardId } = await request.json();

        if (!rewardId || !REWARDS[rewardId]) {
            return NextResponse.json({ error: 'Récompense invalide' }, { status: 400 });
        }

        const reward = REWARDS[rewardId];

        // 2. Count user's books
        const { count } = await supabaseAdmin
            .from('generated_books')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if ((count || 0) < reward.threshold) {
            return NextResponse.json({ error: 'Seuil non atteint' }, { status: 403 });
        }

        // 3. Check if already claimed
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('monthly_credits, rewards_claimed')
            .eq('id', user.id)
            .single();

        const claimed = profile?.rewards_claimed || [];

        if (claimed.includes(rewardId)) {
            return NextResponse.json({ error: 'Déjà réclamé', alreadyClaimed: true }, { status: 409 });
        }

        // 4. Grant credits and mark as claimed
        const newClaimed = [...claimed, rewardId];
        const newCredits = (profile?.monthly_credits || 0) + reward.credits;

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
                monthly_credits: newCredits,
                rewards_claimed: newClaimed,
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('❌ Reward claim error:', updateError);
            return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
        }

        console.log(`🎉 Reward claimed: ${rewardId} (+${reward.credits} credits) for user ${user.id}`);

        return NextResponse.json({
            success: true,
            rewardId,
            creditsGranted: reward.credits,
            newCreditTotal: newCredits,
            label: reward.label,
        });

    } catch (error) {
        console.error('❌ Reward API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
