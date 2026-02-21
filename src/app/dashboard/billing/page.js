'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function BillingContent() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [portalLoading, setPortalLoading] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [creditQty, setCreditQty] = useState(1);
    const [buyingCredits, setBuyingCredits] = useState(false);
    const [successMsg, setSuccessMsg] = useState(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Check for credit purchase success
        if (searchParams.get('credit_success') === 'true') {
            const qty = searchParams.get('qty') || '1';
            setSuccessMsg(`🎉 ${qty} crédit${qty > 1 ? 's' : ''} ajouté${qty > 1 ? 's' : ''} avec succès !`);
            // Clean URL
            window.history.replaceState({}, '', '/dashboard/billing');
        }
    }, [searchParams]);

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
            if (!res.ok) throw new Error(data.error || 'Erreur lors de la redirection');
            if (data.url) window.location.href = data.url;
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
            if (session.url) window.location.href = session.url;
            else throw new Error("Impossible de rediriger vers le paiement.");
        } catch (error) {
            console.error("Subscription Error:", error);
            alert("Erreur: " + error.message);
            setLoading(false);
        }
    };

    const handleBuyCredits = async () => {
        setBuyingCredits(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/checkout/credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: profile.id,
                    email: session?.user?.email || profile.email || '',
                    quantity: creditQty,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur');
            if (data.url) window.location.href = data.url;
        } catch (error) {
            console.error("Credit Purchase Error:", error);
            alert("Erreur: " + error.message);
        } finally {
            setBuyingCredits(false);
        }
    };

    const getNextRenewalDate = () => {
        if (!profile?.subscription_started_at) return null;
        const startDate = new Date(profile.subscription_started_at);
        const now = new Date();

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
    const credits = profile?.monthly_credits || 0;
    const CREDIT_PRICE = 1500;

    const creditOptions = [
        { qty: 1, price: 1500, label: '1 crédit', savings: null },
        { qty: 3, price: 4500, label: '3 crédits', savings: null },
        { qty: 5, price: 7500, label: '5 crédits', savings: null },
    ];

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 border-l-8 border-orange-500 pl-4 py-1">
                        Facturation & Abonnement
                    </h1>
                </div>

                {/* Success Message */}
                {successMsg && (
                    <div className="bg-green-100 text-green-700 p-4 rounded-xl mb-6 font-bold text-sm flex items-center gap-2">
                        {successMsg}
                        <button onClick={() => setSuccessMsg(null)} className="ml-auto text-green-500 hover:text-green-700">✕</button>
                    </div>
                )}

                {/* ===== SUBSCRIPTION STATUS ===== */}
                <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 mb-6 relative overflow-hidden">
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
                                        onClick={() => setShowCancelModal(true)}
                                        className="text-gray-500 hover:text-red-500 px-4 py-3 font-medium transition-colors text-sm underline"
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

                {/* ===== CREDITS SECTION (Club Members Only) ===== */}
                {isMember && (
                    <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 mb-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm">🎫</span>
                            Mes Crédits PDF
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            1 crédit = 1 PDF à télécharger et imprimer. Vous recevez 1 crédit gratuit chaque mois avec votre abonnement.
                        </p>

                        {/* Credit Balance */}
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 mb-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Solde actuel</p>
                                <p className="text-4xl font-black text-orange-600">{credits}</p>
                                <p className="text-xs text-gray-400 mt-1">crédit{credits !== 1 ? 's' : ''} disponible{credits !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="text-6xl opacity-30">🎫</div>
                        </div>

                        {/* Buy Credits */}
                        <div className="border border-gray-100 rounded-2xl p-6">
                            <h4 className="font-bold text-gray-900 mb-4 text-sm">Acheter des crédits</h4>

                            <div className="grid grid-cols-3 gap-3 mb-6">
                                {creditOptions.map(opt => (
                                    <button
                                        key={opt.qty}
                                        onClick={() => setCreditQty(opt.qty)}
                                        className={`p-4 rounded-xl border-2 text-center transition-all ${creditQty === opt.qty
                                            ? 'border-orange-500 bg-orange-50 shadow-md'
                                            : 'border-gray-100 hover:border-orange-200 hover:bg-orange-50/50'
                                            }`}
                                    >
                                        <span className="block text-2xl font-black text-gray-900">{opt.qty}</span>
                                        <span className="block text-xs text-gray-500 mt-1">crédit{opt.qty > 1 ? 's' : ''}</span>
                                        <span className="block text-sm font-bold text-orange-600 mt-2">
                                            {opt.price.toLocaleString()} F
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleBuyCredits}
                                disabled={buyingCredits}
                                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {buyingCredits ? (
                                    'Redirection vers le paiement...'
                                ) : (
                                    <>
                                        🎫 Acheter {creditQty} crédit{creditQty > 1 ? 's' : ''} — {(creditQty * CREDIT_PRICE).toLocaleString()} FCFA
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-400 text-center mt-3">
                                Paiement sécurisé par Stripe. 1 crédit = 1 500 FCFA.
                            </p>
                        </div>
                    </div>
                )}

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

            {/* ===== RETENTION MODAL ===== */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative animate-[fadeInUp_0.3s_ease-out]">
                        <div className="bg-gradient-to-br from-orange-50 to-pink-50 p-8 text-center border-b border-orange-100">
                            <div className="text-6xl mb-4">😢</div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">
                                Nous sommes tristes de vous voir partir…
                            </h2>
                            <p className="text-gray-600 text-sm">
                                Êtes-vous sûr(e) de vouloir résilier votre abonnement Club Kusoma ?
                            </p>
                        </div>
                        <div className="p-8">
                            <p className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
                                En résiliant, vous perdez :
                            </p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 mt-0.5">✗</span>
                                    <span className="text-gray-700 text-sm">L'accès <strong>illimité</strong> à toutes les histoires en lecture + audio</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 mt-0.5">✗</span>
                                    <span className="text-gray-700 text-sm">Le mode <strong>"Magic Story"</strong> — créer des histoires 100% personnalisées avec l'IA</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 mt-0.5">✗</span>
                                    <span className="text-gray-700 text-sm"><strong>1 PDF gratuit</strong> chaque mois (valeur 3 000 FCFA)</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 mt-0.5">✗</span>
                                    <span className="text-gray-700 text-sm">La <strong>réduction de 50%</strong> sur les PDFs supplémentaires</span>
                                </li>
                            </ul>
                            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-8">
                                <p className="text-sm text-orange-800 text-center">
                                    💡 <strong>Le saviez-vous ?</strong> Votre abonnement revient à seulement <strong>216 FCFA/jour</strong> — moins qu'un jus de fruit — pour offrir à vos enfants des histoires qui les font rêver et apprendre.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:scale-[1.02] transition-all shadow-orange-500/20"
                                >
                                    ❤️ Je reste membre du Club !
                                </button>
                                <button
                                    onClick={() => { setShowCancelModal(false); handlePortalRedirect(); }}
                                    disabled={portalLoading}
                                    className="w-full text-gray-400 py-3 text-sm hover:text-gray-600 transition-colors disabled:opacity-50"
                                >
                                    {portalLoading ? 'Redirection...' : 'Je souhaite quand même résilier →'}
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCancelModal(false)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-white transition-all shadow-sm"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

export default function BillingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen pt-40 text-center">Chargement...</div>}>
            <BillingContent />
        </Suspense>
    );
}
