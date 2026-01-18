'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

function SetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const email = searchParams.get('email');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setLoading(true);

        try {
            // For ghost accounts, we need to set password via API
            // Call our custom API endpoint to set password for ghost account
            const response = await fetch('/api/auth/set-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Une erreur est survenue');
                setLoading(false);
                return;
            }

            // Now sign in with the new password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (signInError) {
                setError('Connexion échouée. Veuillez réessayer.');
                setLoading(false);
                return;
            }

            // Redirect to onboarding
            router.push('/onboarding?from=purchase');
        } catch (err) {
            console.error('Password setup error:', err);
            setError('Une erreur est survenue. Veuillez réessayer.');
            setLoading(false);
        }
    };

    if (!email) {
        return (
            <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
                    <p className="text-red-500">Email manquant. Veuillez utiliser le lien de l'email.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center p-4">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🔐</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Définissez votre mot de passe</h1>
                    <p className="text-gray-600 text-sm">
                        Pour <strong>{email}</strong>
                    </p>
                </div>

                <form onSubmit={handleSetPassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                            placeholder="Minimum 6 caractères"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Confirmer le mot de passe
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                            placeholder="Retapez votre mot de passe"
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition-transform hover:scale-105 shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Chargement...' : 'Activer mon compte'}
                    </button>
                </form>

                <p className="mt-6 text-xs text-gray-400 text-center">
                    Déjà un compte ? <a href="/login" className="text-orange-500 hover:underline">Se connecter</a>
                </p>
            </div>
        </div>
    );
}

export default function SetPasswordPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <SetPasswordContent />
        </Suspense>
    );
}
