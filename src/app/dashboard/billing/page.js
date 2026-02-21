'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function BillingPage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [portalLoading, setPortalLoading] = useState(false);
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
        setPortalLoading(true);
        try {
            const res = await fetch('/api/billing/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: profile.id }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erreur lors de la redirection');
            }

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Portal Error:', error);
            alert('Erreur: ' + error.message);
        } finally {
            setPortalLoading(false);
        }
    };

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/checkout/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: profile.id,
                    email: profile.email || profile.email_address || '',
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

    // Calculate next renewal date from subscription_started_at
    const getNextRenewalDate = () => {
        if (!profile?.subscription_started_at) return null;
        const startDate = new Date(profile.subscription_started_at);
        const now = new Date();

        // Find the next renewal by adding months from start date
        let nextRenewal = new Date(startDate);
        while (nextRenewal <= now) {
            nextRenewal.setMonth(nextRenewal.getMonth() + 1);
        }

        return nextRenewal.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) return <div className="min-h-screen pt-40 text-center">Chargement...</div>;

    const isMember = profile?.subscription_status === 'active';
    const renewalDate = getNextRenewalDate();

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
                                    Vous bénéficiez de tous les avantages du club.
                                    {renewalDate && <> Prochain renouvellement le <strong>{renewalDate}</strong>.</>}
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={handlePortalRedirect}
                                        disabled={portalLoading}
                                        className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {portalLoading ? 'Redirection...' : 'Gérer mon abonnement'}
                                    </button>
                                    <button
                                        onClick={handlePortalRedirect}
                                        disabled={portalLoading}
                                        className="text-gray-500 hover:text-red-500 px-4 py-3 font-medium transition-colors text-sm underline disabled:opacity-50"
                                    >
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

                {/* Info Card */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-xl text-gray-900 mb-4">Gestion de votre abonnement</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Cliquez sur <strong>"Gérer mon abonnement"</strong> pour accéder au portail sécurisé Stripe où vous pourrez :
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Modifier votre carte de paiement</li>
                        <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Consulter vos factures et reçus</li>
                        <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Annuler votre abonnement à tout moment</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
