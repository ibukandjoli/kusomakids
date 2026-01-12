'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyEmailPage() {
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
                type: 'email',
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl text-center">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
                    🔐
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Vérifiez votre email</h2>
                <p className="text-gray-600 mb-8">
                    Un code à 6 chiffres a été envoyé à <strong>{email}</strong>.
                </p>

                <form onSubmit={handleVerify} className="space-y-6">
                    <input
                        type="text"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="123456"
                        className="w-full text-center text-2xl tracking-widest p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none font-mono"
                        maxLength={6}
                        required
                    />

                    {error && (
                        <div className="text-red-500 text-sm">{error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors"
                    >
                        {loading ? 'Vérification...' : 'Valider'}
                    </button>

                    <p className="text-xs text-gray-400 mt-4">
                        Pas reçu ? Vérifiez vos spams.
                    </p>
                </form>
            </div>
        </div>
    );
}
