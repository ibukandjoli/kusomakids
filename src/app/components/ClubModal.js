'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function ClubModal({ isOpen, onClose, user, childName }) {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubscription = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/checkout/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    email: user?.email,
                    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID
                }),
            });

            const session = await response.json();
            if (session.error) throw new Error(session.error);

            if (session.url) {
                window.location.href = session.url;
            } else {
                throw new Error("Impossible de rediriger vers le paiement.");
            }
        } catch (error) {
            console.error("Subscription Error:", error);
            alert("Erreur: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 z-10 bg-white/80 rounded-full p-2 backdrop-blur-sm transition-colors">✕</button>

                {/* Top Gradient Banner */}
                <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 p-8 pb-12 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -ml-8 -mb-8 pointer-events-none"></div>

                    <div className="relative z-10">
                        <span className="text-5xl mb-3 block">🪄</span>
                        <h2 className="text-2xl md:text-3xl font-black mb-2">Rejoignez le Club Kusoma</h2>
                        <p className="text-white/80 text-sm max-w-sm mx-auto">
                            La création d'histoires magiques par IA est une fonctionnalité exclusive réservée aux membres du Club.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 pt-6 -mt-4 relative">
                    <div className="bg-orange-50/80 border-2 border-orange-200 rounded-2xl p-6 mb-6">
                        <h3 className="font-black text-gray-900 text-lg mb-4 text-center">Club Kusoma VIP 🌟</h3>
                        <ul className="space-y-3 mb-6">
                            <li className="flex items-start gap-3">
                                <span className="text-green-500 text-lg mt-0.5">✓</span>
                                <span className="text-gray-700 text-sm"><strong>Création d'Histoires Originales</strong></span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-500 text-lg mt-0.5">✓</span>
                                <span className="text-gray-700 text-sm"><strong>Lecture illimitée</strong> (Audio inclus)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-500 text-lg mt-0.5">✓</span>
                                <span className="text-gray-700 text-sm"><strong>1 PDF Haute Qualité offert / mois</strong></span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-500 text-lg mt-0.5">✓</span>
                                <span className="text-gray-700 text-sm"><strong>-50% sur les PDF suivants</strong></span>
                            </li>
                        </ul>

                        <div className="text-center mb-4">
                            <div className="text-4xl font-black text-orange-600">
                                6.500 <span className="text-base font-normal text-gray-500">FCFA / mois</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Annulable à tout moment. Zéro risque.</p>
                        </div>

                        <button
                            onClick={handleSubscription}
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-lg hover:shadow-xl hover:shadow-orange-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Redirection...
                                </>
                            ) : (
                                <>
                                    <span>⭐</span> Devenir Membre du Club
                                </>
                            )}
                        </button>
                    </div>

                    <p className="text-center text-xs text-gray-400">
                        Paiement sécurisé par Stripe. Résiliez quand vous voulez.
                    </p>
                </div>
            </div>
        </div>
    );
}
