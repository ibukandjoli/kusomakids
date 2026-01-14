'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import Testimonials from '@/app/components/Testimonials';
import { formatTitle } from '@/utils/format';
import { STATIC_COVERS } from '@/lib/static-covers';

export default function BookDetailClient({ initialBook, initialRelatedBooks }) {
    const [book, setBook] = useState(initialBook || null);
    const [relatedBooks, setRelatedBooks] = useState(initialRelatedBooks || []);
    const [loading, setLoading] = useState(!initialBook);
    const [childName, setChildName] = useState(null);

    useEffect(() => {
        async function init() {
            // Fetch User Child Name
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: children } = await supabase
                    .from('children')
                    .select('first_name')
                    .eq('user_id', session.user.id)
                    .limit(1);

                if (children && children.length > 0) {
                    setChildName(children[0].first_name);
                }
            }

            if (!initialBook) {
                // Fetch logic if needed, skipped for MVP as we rely on SSR mainly
                setLoading(false);
            } else {
                setLoading(false);
            }
        }
        init();
    }, [initialBook]);

    // Helper to personalize text
    const personalize = (text) => {
        if (!text) return '';
        // If not logged in, we still want to show a generic placeholder or keep it cleaner
        // Current formatTitle keeps placeholders? formatTitle handles formatting but regex replacement handles content.
        const name = childName || 'Votre Enfant';
        // Note: Replace both brackets style
        return formatTitle(text)
            .replace(/\[Son prénom\]/gi, name)
            .replace(/\{childName\}/gi, name);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-32 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="min-h-screen bg-gray-50 pt-32 text-center px-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Livre introuvable</h1>
                <Link href="/books" className="text-orange-500 hover:underline">Retour à la bibliothèque</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-orange-50 pt-32 pb-20">
            <div className="container mx-auto px-4">

                {/* Breadcrumb */}
                <div className="mb-8 text-sm text-gray-500">
                    <Link href="/" className="hover:text-orange-500">Accueil</Link> &gt;
                    <Link href="/books" className="hover:text-orange-500 mx-1">Bibliothèque</Link> &gt;
                    <span className="text-gray-900 mx-1 font-medium">{personalize(book.title)}</span>
                </div>

                <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">

                    {/* Left Column: Cover Image & Gallery */}
                    <div>
                        <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl mb-6 bg-white transition-all duration-500">
                            {book.cover_url || STATIC_COVERS[book.theme_slug] ? (
                                <Image
                                    src={book.cover_url || STATIC_COVERS[book.theme_slug] || '/images/covers/cover_school.jpg'}
                                    alt={book.title}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
                                    Aperçu non disponible
                                </div>
                            )}
                        </div>
                        {/* Placeholder for Gallery / Preview Pages - Hidden on Mobile */}
                        <div className="hidden md:grid grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="aspect-square bg-gray-100 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                                    {/* Blurred Cover Background */}
                                    <Image
                                        src={book.cover_url || STATIC_COVERS[book.theme_slug] || '/images/covers/cover_school.jpg'}
                                        alt="Aperçu verrouillé"
                                        fill
                                        className="object-cover filter blur-sm opacity-50"
                                    />
                                    {/* Lock Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Details & Actions */}
                    <div className="sticky top-32">

                        {/* Metadata (Pills) - Smaller Text on Mobile */}
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-600">
                                {book.age_range}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-600">
                                {book.theme || 'Aventure'}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                            {personalize(book.title)}
                        </h1>

                        <p className="text-lg md:text-xl text-gray-500 italic mb-6 font-serif">"{book.tagline}"</p>

                        <div className="flex flex-wrap items-end gap-x-3 gap-y-1 mb-8">
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold text-orange-500 leading-none">3.000 F</span>
                                <span className="text-gray-400 line-through text-sm mb-1">5.000 F</span>
                            </div>
                            <span className="text-green-600 font-bold text-xs px-2 py-1 bg-green-100 rounded-full mb-1">
                                -40% Lancement
                            </span>
                        </div>

                        <div className="prose prose-lg text-gray-700 leading-relaxed mb-8">
                            <p>{formatTitle(book.description)}</p>
                        </div>

                        {/* BENEFITS SECTION */}
                        {book.benefits && book.benefits.length > 0 && (
                            <div className="mb-8">
                                <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Ce que votre enfant va apprendre :</h3>
                                <div className="flex flex-wrap gap-2">
                                    {book.benefits.map((benefit, idx) => (
                                        <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                            🌱 {benefit}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <ul className="space-y-4 mb-10 border-t border-gray-100 pt-6">
                            <li className="flex items-center gap-3 text-gray-700">
                                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">✨</div>
                                Héros personnalisé (Prénom + Visage)
                            </li>
                            <li className="flex items-center gap-3 text-gray-700">
                                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">🔒</div>
                                Version Audio (Membres Club Kusoma)
                            </li>
                            <li className="flex items-center gap-3 text-gray-700">
                                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs">✓</div>
                                Aperçu gratuit 3 pages avant achat
                            </li>
                        </ul>

                        <Link
                            href={`/book/${book.id}/personalize`}
                            className="block w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-xl py-5 rounded-2xl text-center shadow-lg shadow-orange-500/30 transition-all transform hover:-translate-y-1 mb-6 uppercase tracking-wide"
                        >
                            Je Personnalise (3 min) ⚡️
                        </Link>

                        <div className="flex flex-col items-center gap-4">
                            <p className="text-center text-[10px] md:text-sm text-gray-500 font-medium flex items-center gap-2 whitespace-nowrap">
                                <svg className="w-3 h-3 md:w-4 md:h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                Paiement 100% sécurisé par Wave & CB
                            </p>
                            {/* Payment Methods Image */}
                            <div className="relative w-64 h-10 grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100">
                                <Image src="/images/payment-methods.png" alt="Moyens de paiement" fill className="object-contain" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- OTHER STORIES SECTION --- */}
                <div className="mt-24 mb-20 px-4">
                    <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Vous aimerez aussi</h2>

                    {relatedBooks.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {relatedBooks.slice(0, 3).map((related) => (
                                <Link href={`/book/${related.theme_slug || related.id}`} key={related.id} className="group block">
                                    <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-4 shadow-md group-hover:shadow-lg transition-all border border-gray-100">
                                        <Image
                                            src={related.cover_url || STATIC_COVERS[related.theme_slug] || '/images/covers/cover_school.jpg'}
                                            alt={related.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-orange-600 transition-colors mb-1">
                                        {personalize(related.title)}
                                    </h3>
                                    <p className="text-sm text-gray-500">{related.age_range.replace(/\s*ans$/i, '')} ans</p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center">
                            <Link href="/books" className="inline-block border-2 border-orange-500 text-orange-600 px-8 py-3 rounded-full font-bold hover:bg-orange-50 transition-colors">
                                Voir toute la bibliothèque
                            </Link>
                        </div>
                    )}
                </div>

                {/* Reviews Section */}
                <div className="border-t border-orange-200 pt-20">
                    <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">L'avis des parents</h2>
                    <Testimonials darkMode={false} />
                </div>

            </div>
        </div>
    );
}
