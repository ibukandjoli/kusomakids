'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FcGoogle } from 'react-icons/fc';

export default function GoogleAuthButton({ text = "Continuer avec Google" }) {
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/google-callback`,
                },
            });

            if (error) throw error;
        } catch (error) {
            console.error('Google Auth Error:', error.message);
            alert("Erreur lors de la connexion Google. Veuillez réessayer.");
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold py-3.5 px-4 rounded-xl border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed group"
        >
            {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
            ) : (
                <FcGoogle className="text-2xl group-hover:scale-110 transition-transform" />
            )}
            <span>{loading ? 'Connexion...' : text}</span>
        </button>
    );
}
