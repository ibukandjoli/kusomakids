'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function OnboardingSuccess() {
    const [showModal, setShowModal] = useState(true);
    const [user, setUser] = useState(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        async function checkSession() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
            }
        }
        checkSession();
    }, []);

    const handleContinue = () => {
        setShowModal(false);
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Petals Background */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute animate-fall"
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${5 + Math.random() * 5}s`,
                        }}
                    >
                        🌸
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl w-full text-center animate-scale-in">
                    {/* Celebration Icon */}
                    <div className="text-8xl mb-6 animate-bounce">🎉</div>

                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                        Bienvenue au Club Kusoma !
                    </h1>

                    <p className="text-xl text-gray-600 mb-8">
                        Vous êtes maintenant membre du club le plus magique d'Afrique ! ✨
                    </p>

                    {/* Benefits List */}
                    <div className="bg-orange-50 rounded-2xl p-6 mb-8 text-left">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                            Vos avantages exclusifs
                        </h2>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <span className="text-2xl">📚</span>
                                <div>
                                    <p className="font-bold text-gray-900">Histoires illimitées</p>
                                    <p className="text-sm text-gray-600">Créez autant d'histoires que vous voulez</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-2xl">🔓</span>
                                <div>
                                    <p className="font-bold text-gray-900">Accès complet</p>
                                    <p className="text-sm text-gray-600">Toutes vos histoires sont débloquées automatiquement</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-2xl">🎧</span>
                                <div>
                                    <p className="font-bold text-gray-900">Audio premium</p>
                                    <p className="text-sm text-gray-600">Écoutez vos histoires avec narration audio</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-2xl">📥</span>
                                <div>
                                    <p className="font-bold text-gray-900">PDFs illimités</p>
                                    <p className="text-sm text-gray-600">Téléchargez toutes vos histoires en PDF</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={handleContinue}
                        className="w-full bg-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-600 transition-all shadow-lg hover:shadow-orange-500/50 hover:scale-105"
                    >
                        Découvrir mes histoires 🚀
                    </button>

                    {sessionId && (
                        <p className="text-xs text-gray-400 mt-4">
                            Session ID: {sessionId.slice(0, 20)}...
                        </p>
                    )}
                </div>
            )}

            <style jsx>{`
                @keyframes fall {
                    0% {
                        transform: translateY(-100px) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(360deg);
                        opacity: 0;
                    }
                }
                .animate-fall {
                    animation: fall linear infinite;
                }
                @keyframes scale-in {
                    0% {
                        transform: scale(0.8);
                        opacity: 0;
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .animate-scale-in {
                    animation: scale-in 0.5s ease-out;
                }
            `}</style>
        </div>
    );
}
