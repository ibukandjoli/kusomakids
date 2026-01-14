'use client';

import { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '../components/AuthLayout';

function VerifyContent() {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token,
                type: 'signup',
            });

            if (error) throw error;

            // Success -> Go to Onboarding
            router.push('/onboarding');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-md">
                    🔐
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Vérifiez votre email</h2>
                <p className="text-gray-600 mb-8">
                    Un code de vérification a été envoyé à <strong>{email}</strong>.
                </p>

                <form onSubmit={handleVerify} className="space-y-6">
                    <input
                        type="text"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Code reçu"
                        className="w-full text-center text-3xl tracking-[1rem] p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none font-mono transition-all focus:ring-4 focus:ring-orange-100 bg-white"
                        maxLength={8}
                        required
                    />

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center justify-center gap-2">
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg hover:shadow-orange-500/30 disabled:opacity-50"
                    >
                        {loading ? 'Vérification...' : 'Valider mon code'}
                    </button>

                    <p className="text-sm text-gray-500 mt-6">
                        Pas reçu ? <button type="button" className="text-orange-600 font-bold hover:underline">Renvoyer le code</button>
                    </p>
                </form>
            </div>
        </AuthLayout>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
            <VerifyContent />
        </Suspense>
    );
}
