'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function SubscriptionTab({ profile, user }) {
    const isVip = profile?.subscription_status === 'active';
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const stripe = await stripePromise;
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

            const result = await stripe.redirectToCheckout({
                sessionId: session.sessionId,
            });
            if (result.error) throw new Error(result.error.message);
        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Mon Abonnement 💳</h2>

            {isVip ? (
                <div className="bg-gradient-to-br from-orange-500 to-pink-600 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-white opacity-10 rounded-full transform translate-x-12 -translate-y-12"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <div className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-bold mb-4">ACTIF</div>
                            <h3 className="text-3xl font-black mb-2">Membre Club Kusoma VIP 🌟</h3>
                            <p className="opacity-90 max-w-lg">
                                Vous profitez de la lecture illimitée, d'un PDF offert chaque mois et d'offres exclusives.
                                Merci de faire partie de la famille !
                            </p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm text-center min-w-[150px]">
                            <span className="block text-3xl">🎉</span>
                            <span className="font-bold text-sm">Zéro Limite</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-8 md:p-12 text-center bg-orange-50">
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">Rejoignez le Club maintenant</h3>
                        <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                            Débloquez tout le potentiel de KusomaKids. Créez, lisez et téléchargez sans compter.
                        </p>
                        <div className="text-5xl font-black text-orange-600 mb-2">
                            6.500 <span className="text-lg text-gray-500 font-medium">FCFA / mois</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-8">Sans engagement.</p>

                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="bg-orange-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition-all shadow-xl hover:shadow-orange-500/30 transform hover:-translate-y-1"
                        >
                            {loading ? 'Redirection...' : 'S\'abonner au Club 🚀'}
                        </button>
                    </div>
                    <div className="bg-white p-8 grid md:grid-cols-3 gap-6 text-center">
                        <div>
                            <span className="text-4xl block mb-2">📚</span>
                            <h4 className="font-bold">Histoires Illimitées</h4>
                            <p className="text-sm text-gray-500">Créez autant que vous voulez.</p>
                        </div>
                        <div>
                            <span className="text-4xl block mb-2">🎧</span>
                            <span className="font-bold">Audio Inclus</span>
                            <p className="text-sm text-gray-500">Écoutez vos créations.</p>
                        </div>
                        <div>
                            <span className="text-4xl block mb-2">🎁</span>
                            <h4 className="font-bold">Cadeaux Mensuels</h4>
                            <p className="text-sm text-gray-500">1 PDF offert / mois.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
