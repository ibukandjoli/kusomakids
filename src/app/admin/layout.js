'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function AdminLayout({ children }) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        async function checkAdmin() {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    router.push('/login');
                    return;
                }

                // Check Profile Role
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                if (error || profile?.role !== 'admin') {
                    console.warn('Access denied: User is not admin');
                    router.push('/'); // Redirect to home
                    return;
                }

                setIsAuthorized(true);
            } catch (err) {
                console.error('Admin Check Error:', err);
                router.push('/');
            } finally {
                setLoading(false);
            }
        }

        checkAdmin();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null; // Don't render anything while redirecting
    }

    return (
        <>
            {children}
        </>
    );
}
