'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

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
            setMessage('Un email de réinitialisation vous a été envoyé.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-6">
                        <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-lg shadow-orange-500/30">
                            K
                        </div>
                    </Link>
                    <h2 className="text-2xl font-bold text-gray-900">Mot de passe oublié ?</h2>
                    <p className="text-gray-500 mt-2">Entrez votre email pour recevoir un lien de réinitialisation.</p>
                </div>

                {message ? (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-center">
                        <p className="font-bold mb-2">Email envoyé !</p>
                        <p className="text-sm">{message}</p>
                        <Link href="/login" className="block mt-4 text-orange-600 font-bold hover:underline">
                            Retour à la connexion
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleReset} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="sr-only">Email</label>
                            <input
                                type="email"
                                id="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="Votre adresse email"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Envoi...' : 'Envoyer le lien'}
                        </button>
                        <div className="text-center">
                            <Link href="/login" className="text-gray-500 hover:text-gray-900 text-sm">
                                Annuler et retourner à la connexion
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
