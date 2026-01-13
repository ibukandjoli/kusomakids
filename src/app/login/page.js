'use client';

import { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '../components/AuthLayout';

function LoginContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            // Contextual Redirect (Signup Flow)
            const storedContext = localStorage.getItem('signup_context');
            let nextUrl = '/dashboard';

            if (storedContext) {
                const { plan, bookId } = JSON.parse(storedContext);
                if (plan === 'club') {
                    nextUrl = `/checkout?plan=club${bookId ? `&book_id=${bookId}` : ''}`;
                }
                localStorage.removeItem('signup_context'); // Clean up
            } else if (searchParams.get('plan') === 'club') {
                const bookId = searchParams.get('redirect_book_id');
                nextUrl = `/checkout?plan=club${bookId ? `&book_id=${bookId}` : ''}`;
            }

            router.push(nextUrl);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="text-center">
                <Link href="/" className="inline-block mb-8">
                    <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-lg shadow-orange-500/30">
                        K
                    </div>
                </Link>
                <h2 className="text-3xl font-extrabold text-gray-900">Accéder à votre espace</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Heureux de vous revoir ! {' '}
                    <Link href="/signup" className="font-medium text-orange-600 hover:text-orange-500 underline decoration-2 underline-offset-2">
                        Rejoindre le Club
                    </Link>
                </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
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
                            placeholder="exemple@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
                            <Link href="/forgot-password" className="text-xs font-medium text-orange-600 hover:text-orange-500">
                                Oublié ?
                            </Link>
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="appearance-none rounded-xl block w-full px-4 py-3 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                    >
                        {loading ? 'Connexion...' : 'Accéder à mon espace →'}
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
            <LoginContent />
        </Suspense>
    );
}
