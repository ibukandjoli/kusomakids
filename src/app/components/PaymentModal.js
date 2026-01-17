'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import Link from 'next/link';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function PaymentModal({ isOpen, onClose, user, bookId, profile }) {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    // Handle Subscription (Club)
    const handleSubscription = async () => {
        setLoading(true);
        try {
            const stripe = await stripePromise;
            // Re-use existing endpoint
            const response = await fetch('/api/checkout/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID
                }),
            });

            const session = await response.json();
            if (session.error) throw new Error(session.error);

            if (session.url) {
                window.location.href = session.url;
            } else {
                throw new Error("Impossible de rediriger vers le paiement (URL manquante).");
            }
        } catch (error) {
            console.error("Subscription Error:", error);
            alert("Erreur: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle One-Off Purchase
    const handleOneOff = async () => {
        setLoading(true);
        try {
            const stripe = await stripePromise;
            // Call new endpoint for One-Off
            const response = await fetch('/api/checkout/one-time', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    bookId: bookId,
                    amount: profile?.subscription_status === 'active' ? 1500 : 3000 // Club members get 50% off
                }),
            });

            const session = await response.json();
            if (session.error) throw new Error(session.error);

            if (session.url) {
                window.location.href = session.url;
            } else {
                throw new Error("Impossible de rediriger vers le paiement (URL manquante).");
            }
        } catch (error) {
            console.error("One-time Purchase Error:", error);
            alert("Erreur: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-5xl w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[90vh]">

                {/* --- LEFT: VISUAL RECALL (Desktop Only) --- */}
                <div className="hidden md:block w-1/3 bg-gray-100 relative">
                    {/* Visual Recall - Use a placeholder or the actual cover passed via props?
                        Looking at usage in Dashboard, we only pass `bookId`. We don't verify if `bookCover` is passed. 
                        Let's check usage. Dashboard passes: <PaymentModal ... bookId={selectedBookId} />
                        It DOES NOT pass bookCover. We should probably fetch it or just show a generic image if missing.
                        For now, let's just use a Safe Fallback to prevent crash.
                    */}
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-200">
                        <span className="text-4xl">🎁</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-8 left-8 text-white z-10">
                        <p className="text-sm opacity-80 font-medium tracking-wide uppercase mb-2">Votre création</p>
                        <h3 className="text-2xl font-bold leading-tight">Offrez ce souvenir pour la vie.</h3>
                    </div>
                </div>

                {/* --- RIGHT: ACTIONS --- */}
                <div className="flex-1 flex flex-col relative">
                    <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 z-10 bg-white/50 rounded-full p-2 backdrop-blur-sm transition-colors">✕</button>

                    <div className="p-8 md:p-12 text-center">
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Débloquez l'histoire ✨</h2>
                        <p className="text-gray-600 mb-8">Choisissez la meilleure option pour {user?.child_name || 'votre enfant'}.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* OPTION A: ONE-OFF */}
                            <div className="border-2 border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors relative group text-left">
                                <div className="absolute top-4 right-4 text-gray-300 group-hover:text-gray-400">📚</div>
                                <h3 className="font-bold text-gray-900 text-lg mb-1">Juste cette histoire</h3>
                                <p className="text-xs text-gray-500 mb-4 h-8">Accès à vie (PDF + Audio)</p>
                                <div className="text-2xl font-black text-gray-900 mb-6">
                                    {profile?.subscription_status === 'active' ? (
                                        <>
                                            <span className="text-green-600">1.500</span>{' '}
                                            <span className="text-xs font-normal text-gray-400">FCFA</span>
                                            <div className="text-xs text-gray-400 line-through mt-1">3.000 FCFA</div>
                                            <div className="text-xs text-green-600 font-bold mt-1">🏆 -50% Membre du Club</div>
                                        </>
                                    ) : (
                                        <>
                                            3.000 <span className="text-xs font-normal text-gray-400">FCFA</span>
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={handleOneOff}
                                    disabled={loading}
                                    className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:border-gray-900 hover:text-gray-900 transition-all text-sm"
                                >
                                    Achat Unique
                                </button>
                            </div>

                            {/* OPTION B: CLUB (HERO) */}
                            <div className="border-2 border-orange-500 bg-orange-50/30 rounded-2xl p-6 relative text-left shadow-xl shadow-orange-500/10">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-wider shadow-sm">
                                    La formule magique
                                </div>
                                <div className="absolute top-4 right-4 text-orange-500">⭐</div>

                                <h3 className="font-bold text-gray-900 text-lg mb-1">Club Kusoma VIP</h3>
                                <p className="text-xs text-gray-600 mb-4 h-8 font-medium">Tout illimité + 1 PDF/mois</p>

                                <div className="text-3xl font-black text-orange-600 mb-6 flex items-baseline gap-1">
                                    6.500 <span className="text-xs font-normal text-gray-500">FCFA / mois</span>
                                </div>

                                <button
                                    onClick={handleSubscription}
                                    disabled={loading}
                                    className="w-full py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-all text-sm shadow-md hover:shadow-lg hover:shadow-orange-500/30 animate-pulse-slow"
                                >
                                    Devenir Membre
                                </button>
                                <p className="text-[10px] text-center text-gray-400 mt-3 font-medium">Annulable à tout moment. Zéro risque.</p>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
