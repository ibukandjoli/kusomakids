'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import PaymentModal from '@/app/components/PaymentModal';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function BillingPage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function fetchSubscription() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/login');
                    return;
                }

                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                setProfile(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchSubscription();
    }, [router]);
    const handlePortalRedirect = async () => {
        // In a real app, this calls an API to ge the Stripe Portal URL
        alert("Redirection vers le portail de facturation Stripe...");
        // window.location.href = '/api/billing/portal'; 
    };

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/checkout/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: profile.id,
                    email: profile.email || profile.email_address || 'user@example.com', // fallback handled by backend or supabase
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
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen pt-40 text-center">Chargement...</div>;

    const isMember = profile?.subscription_status === 'active';

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 border-l-8 border-orange-500 pl-4 py-1">
                        Facturation & Abonnement
                    </h1>
                </div>

                {/* Status Card */}
                <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 mb-8 relative overflow-hidden">
                    {isMember ? (
                        <>
                            <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-100 to-transparent w-1/2 h-full opacity-50 pointer-events-none"></div>
                            <div className="relative z-10">
                                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                                    Actif
                                </span>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Club Kusoma VIP 🌟</h2>
                                <p className="text-gray-600 mb-6">
                                    Vous bénéficiez de tous les avantages du club. Prochain renouvellement le 15 du mois.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={handlePortalRedirect}
                                        className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg"
                                    >
                                        Gérer mon abonnement
                                    </button>
                                    <button className="text-gray-500 hover:text-red-500 px-4 py-3 font-medium transition-colors text-sm underline">
                                        Résilier
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <span className="text-5xl mb-4 block">😢</span>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Vous n'êtes pas encore membre</h2>
                            <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                Rejoignez le Club Kusoma pour débloquer des histoires illimitées en ligne et 1 PDF offert chaque mois !
                            </p>
                            <button
                                disabled={loading}
                                onClick={handleSubscribe}
                                className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg hover:scale-105 transition-all shadow-orange-500/30"
                            >
                                {loading ? "Redirection..." : "Rejoindre le Club pour 6500 FCFA/mois"}
                            </button>
                        </div>
                    )}
                </div>

                {/* Billing History (Placeholder) */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-xl text-gray-900 mb-6">Historique de facturation</h3>

                    {isMember ? (
                        <div className="space-y-4">
                            {/* Fake Invoice Item */}
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div>
                                    <p className="font-bold text-gray-900">Abonnement Mensuel</p>
                                    <p className="text-xs text-gray-500">14 Jan 2026</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-gray-900">6 500 FCFA</span>
                                    <button className="text-orange-600 text-sm font-bold hover:underline">PDF</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center italic py-4">Aucune facture disponible.</p>
                    )}
                </div>
            </div>

            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                user={profile}
            />
        </div>
    );
}
