'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function ClubPromoModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Check if already seen in this session
        const hasSeenPromo = sessionStorage.getItem('kusoma_club_promo_seen');

        if (!hasSeenPromo) {
            const timer = setTimeout(() => {
                setIsOpen(true);
                sessionStorage.setItem('kusoma_club_promo_seen', 'true');
            }, 5000); // 5 seconds

            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] cursor-pointer"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 m-auto z-[101] w-full max-w-4xl h-fit max-h-[90vh] p-4 flex items-center justify-center pointer-events-none"
                    >
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full overflow-hidden flex flex-col md:flex-row pointer-events-auto relative">

                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 z-10 bg-white/50 hover:bg-white p-2 rounded-full transition-all text-gray-500 hover:text-gray-900"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Image Section (Left) */}
                            <div className="md:w-5/12 bg-gradient-to-br from-indigo-900 to-purple-900 relative min-h-[250px] md:min-h-[450px] flex items-center justify-center overflow-hidden">
                                {/* Decorative Circles */}
                                <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                                <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full translate-x-1/2 translate-y-1/2 blur-2xl"></div>

                                <div className="relative z-10 w-4/5">
                                    <Image
                                        src="/images/magic_book_3d.png"
                                        alt="Livre Magique"
                                        width={400}
                                        height={400}
                                        className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-700"
                                    />
                                </div>

                                {/* Badge */}
                                <div className="absolute bottom-6 left-6 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl">
                                    <p className="text-white text-xs font-bold text-center">
                                        ✨ Déjà 500+ histoires créées
                                    </p>
                                </div>
                            </div>

                            {/* Content Section (Right) */}
                            <div className="md:w-7/12 p-8 md:p-10 flex flex-col justify-center bg-white relative">
                                <div className="mb-2 inline-flex self-start bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    Nouveau
                                </div>

                                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight font-[family-name:var(--font-chewy)]">
                                    Transformez ses rêves en histoires réelles !
                                </h2>

                                <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                                    Avec <span className="font-bold text-indigo-600">Magic Story</span>, créez des livres uniques (texte + illustrations) à partir d'une simple idée.
                                    <br /><br />
                                    <span className="text-sm text-gray-500">Exemple : "Un petit garçon qui voyage sur le dos d'une girafe dans l'espace..."</span>
                                </p>

                                {/* Features List */}
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-3 text-gray-700 font-medium">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">✓</span>
                                        Génération IA illimitée
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-700 font-medium">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">✓</span>
                                        Illustrations style Ghibli
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-700 font-medium">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">✓</span>
                                        Téléchargement PDF inclus
                                    </li>
                                </ul>

                                {/* Pricing & CTA */}
                                <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <div className="text-center sm:text-left">
                                        <p className="text-sm text-gray-500 line-through">9.500 FCFA</p>
                                        <p className="text-2xl font-black text-gray-900">6.500 FCFA <span className="text-sm font-normal text-gray-500">/mois</span></p>
                                    </div>
                                    <Link
                                        href="/club"
                                        className="w-full sm:w-auto flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all text-center"
                                    >
                                        Je rejoins le Club →
                                    </Link>
                                </div>
                                <p className="text-center sm:text-right mt-2 text-xs text-gray-400">
                                    Sans engagement. Annulable à tout moment.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
