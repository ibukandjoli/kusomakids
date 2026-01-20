'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '../components/AuthLayout';

function SignupContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // PERIST CONTEXT: If coming from Preview, save context for post-auth redirect
        const plan = searchParams.get('plan');
        const bookId = searchParams.get('redirect_book_id');

        if (plan === 'club') {
            localStorage.setItem('signup_context', JSON.stringify({ plan, bookId }));
        }
    }, [searchParams]);

    const [success, setSuccess] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            // Redirect to Verify Email page
            router.push(`/verify-email?email=${encodeURIComponent(email)}`);

        } catch (err) {
            console.error('Signup error:', err);
            // Check for specific Supabase error messages regarding existing users
            if (err.message?.includes('registered') || err.message?.includes('already exists')) {
                setError(
                    <span>
                        Cette adresse e-mail est déjà utilisée. <Link href="/login" className="underline font-bold hover:text-red-700">Connectez-vous ici</Link>.
                    </span>
                );
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <AuthLayout>
                <div className="text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 animate-bounce">
                        ✉️
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Vérifiez votre boîte mail</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Un email de confirmation magique a été envoyé à <strong>{email}</strong>. <br />Veuillez cliquer sur le lien pour activer votre compte.
                    </p>
                    <Link href="/login" className="inline-block px-8 py-3 bg-white border-2 border-orange-500 text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-colors">
                        Retour à la connexion
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <div className="text-center">
                <Link href="/" className="inline-block mb-8">
                    <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-lg shadow-orange-500/30">
                        K
                    </div>
                </Link>
                <h2 className="text-3xl font-extrabold text-gray-900">Rejoindre le Club</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Déjà membre ?{' '}
                    <Link
                        href={`/login?${searchParams.toString()}`}
                        className="font-medium text-orange-600 hover:text-orange-500 underline decoration-2 underline-offset-2"
                    >
                        Connectez-vous
                    </Link>
                </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSignup}>
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                        ⚠️ {error}
                    </div>
                )}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">Adresse Email</label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="appearance-none rounded-xl block w-full px-4 py-3 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            placeholder="parents@exemple.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            className="appearance-none rounded-xl block w-full px-4 py-3 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            placeholder="Au moins 6 caractères"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            En vous inscrivant, vous acceptez nos <Link href="/terms" className="underline">Conditions Générales</Link>.
                        </p>
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                    >
                        {loading ? 'Création du compte...' : 'Commencer l\'aventure magique →'}
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
            <SignupContent />
        </Suspense>
    );
}
