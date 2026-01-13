'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import AuthLayout from '../components/AuthLayout';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            setMessage('Un email de réinitialisation magique vous a été envoyé.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (message) {
        return (
            <AuthLayout>
                <div className="text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 animate-bounce">
                        📧
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Email envoyé !</h2>
                    <p className="text-gray-600 mb-8 font-medium">
                        {message} <br /> Vérifiez votre boîte de réception (et vos spams).
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
            <div className="text-center mb-8">
                <Link href="/" className="inline-block mb-6">
                    <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-lg shadow-orange-500/30">
                        K
                    </div>
                </Link>
                <h2 className="text-3xl font-extrabold text-gray-900">Mot de passe oublié ?</h2>
                <p className="text-gray-600 mt-2 font-medium">Pas de panique, ça arrive aux meilleurs magiciens.</p>
            </div>

            <form onSubmit={handleReset} className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                        ⚠️ {error}
                    </div>
                )}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Votre email</label>
                    <input
                        type="email"
                        id="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="appearance-none rounded-xl block w-full px-4 py-3 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder="parents@exemple.com"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all shadow-lg disabled:opacity-50 hover:-translate-y-0.5"
                >
                    {loading ? 'Envoi du sortilège...' : 'Réinitialiser mon mot de passe'}
                </button>

                <div className="text-center pt-4">
                    <Link href="/login" className="text-sm font-bold text-gray-500 hover:text-orange-600 transition-colors">
                        ← Retour à la connexion
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
}
