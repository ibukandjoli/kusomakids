import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options)
                        })
                    },
                },
            }
        )

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.session) {
            const userId = data.session.user.id;

            // Wait a moment for trigger to create profile (race condition fix)
            // Or try to fetch profile with a small retry logic
            let profile = null;
            for (let i = 0; i < 3; i++) {
                const { data: p } = await supabase
                    .from('profiles')
                    .select('onboarding_completed, full_name')
                    .eq('id', userId)
                    .single();

                if (p) {
                    profile = p;
                    break;
                }
                // Wait 500ms before retry
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Enhanced logic:
            // 1. If no profile found (even after retry) -> Needs onboarding (and likely profile creation)
            // 2. If profile found but no full_name -> Needs onboarding
            // 3. If profile found and flag is false -> Needs onboarding
            const needsOnboarding = !profile || !profile.full_name || profile.onboarding_completed === false;

            if (needsOnboarding) {
                return NextResponse.redirect(`${origin}/onboarding?from=google_auth`)
            } else {
                // check_redirect=1 tells dashboard to check localStorage for pending redirect (e.g. /checkout)
                return NextResponse.redirect(`${origin}/dashboard?check_redirect=1`)
            }
        }
    }

    // Login failed or no code
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
