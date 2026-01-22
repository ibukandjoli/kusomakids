'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const logVisit = async () => {
            try {
                // Get or Set Anonymous ID
                let visitorId = localStorage.getItem('visitor_id');
                if (!visitorId) {
                    visitorId = uuidv4();
                    localStorage.setItem('visitor_id', visitorId);
                }

                // Get User (if any)
                const { data: { session } } = await supabase.auth.getSession();
                const userId = session?.user?.id || null;

                // Prepare Data
                const payload = {
                    page_path: pathname + (searchParams.toString() ? '?' + searchParams.toString() : ''),
                    visitor_id: visitorId,
                    user_id: userId,
                    referrer: document.referrer || null,
                    user_agent: navigator.userAgent
                };

                // Send to API (preferred to keep Supabase key logic hidden? No, insert is public RLS)
                // Use direct Supabase insert for speed/simplicity since we enabled public insert
                await supabase.from('analytics_visits').insert(payload);

            } catch (err) {
                // Fail silently for analytics
                console.error("Analytics log error", err);
            }
        };

        // Debounce or just log? 
        // Next.js triggers this on route change.
        if (pathname) {
            logVisit();
        }
    }, [pathname, searchParams]);

    return null;
}
