'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
    const router = useRouter();
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Check if we have a hash with auth tokens
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const type = hashParams.get('type');
                const error = hashParams.get('error');
                const errorDescription = hashParams.get('error_description');

                // Handle errors (expired link, etc.)
                if (error) {
                    console.error('Auth error:', error, errorDescription);
                    setStatus('error');

                    // Show user-friendly message and redirect to login
                    setTimeout(() => {
                        router.push('/login?error=link_expired');
                    }, 3000);
                    return;
                }

                // If we have tokens, set the session
                if (accessToken && type === 'magiclink') {
                    const { data, error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });

                    if (sessionError) {
                        console.error('Session error:', sessionError);
                        setStatus('error');
                        setTimeout(() => router.push('/login'), 3000);
                        return;
                    }

                    if (data.session) {
                        console.log('✅ Magic Link authentication successful');
                        setStatus('success');

                        // Redirect to purchased PDFs page
                        setTimeout(() => {
                            router.push('/dashboard/purchased');
                        }, 1500);
                        return;
                    }
                }

                // If no tokens in hash, check if user is already authenticated
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    router.push('/dashboard/purchased');
                } else {
                    // No tokens and not authenticated - redirect to login
                    router.push('/login');
                }
            } catch (err) {
                console.error('Auth callback error:', err);
                setStatus('error');
                setTimeout(() => router.push('/login'), 3000);
            }
        };

        handleAuthCallback();
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-6"></div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion en cours...</h2>
                        <p className="text-gray-600">Veuillez patienter pendant que nous vous connectons.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="text-6xl mb-6">✅</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion réussie !</h2>
                        <p className="text-gray-600">Redirection vers vos PDFs...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="text-6xl mb-6">⚠️</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Lien expiré</h2>
                        <p className="text-gray-600 mb-4">
                            Ce lien de connexion a expiré. Nous vous redirigeons vers la page de connexion.
                        </p>
                        <p className="text-sm text-gray-500">
                            Astuce : Utilisez le lien dans les 60 minutes suivant sa réception.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
