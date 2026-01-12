'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookReader({ book, user, onUnlock, isEditable = false, onTextChange, extraPages = [] }) {
    const [currentPage, setCurrentPage] = useState(0); // 0 = Cover

    // Normalize pages to objects { text, image }
    // If passed via extraPages (for Preview), use that. Else use book.pages.
    const rawPages = extraPages.length > 0 ? extraPages : (book.pages || []);
    const pages = rawPages.map(p => typeof p === 'string' ? { text: p, image: null } : p);

    const totalPages = pages.length;

    // Access Logic
    const isUnlocked = isEditable || book?.is_unlocked || (user?.subscription_status === 'active');

    const handleNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const isViewLocked = !isUnlocked && currentPage >= 2;

    return (
        <div className="relative w-full max-w-6xl mx-auto aspect-[16/9] lg:aspect-[2/1] bg-[#FDFBF7] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border-4 border-[#F0E6D2]">

            {/* Paper Texture */}
            <div className="absolute inset-0 opacity-30 pointer-events-none z-0 mix-blend-multiply" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper.png")' }}></div>

            <AnimatePresence mode="wait">
                {currentPage === 0 ? (
                    // --- COVER PAGE (Centered) ---
                    <motion.div
                        key="cover"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full h-full flex flex-col items-center justify-center p-8 relative z-10"
                    >
                        <h2 className="text-orange-500 text-sm uppercase tracking-widest font-bold mb-6">Livre Personnalisé</h2>
                        <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-8 text-center leading-tight font-serif">{book.title}</h1>
                        <div className="w-64 h-64 md:w-80 md:h-80 relative rounded-full overflow-hidden shadow-2xl border-8 border-white mb-8 transform hover:scale-105 transition-transform duration-500">
                            {book.cover_url ? (
                                <Image src={book.cover_url} alt="Cover" fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full bg-orange-100 flex items-center justify-center text-4xl">📖</div>
                            )}
                        </div>
                        <p className="text-gray-600 italic text-xl font-serif">Une aventure unique pour {book.child_name}</p>
                    </motion.div>
                ) : (
                    // --- STORY PAGES (Spread: Left Image, Right Text) ---
                    <motion.div
                        key={currentPage}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full h-full flex flex-col md:flex-row relative z-10"
                    >
                        {/* LEFT: IMAGE */}
                        <div className="w-full md:w-1/2 h-1/2 md:h-full relative bg-gray-100 border-b md:border-b-0 md:border-r border-[#E0D0B0] overflow-hidden group">
                            {/* Image or Placeholder */}
                            {pages[currentPage - 1]?.image ? (
                                <Image
                                    src={pages[currentPage - 1].image}
                                    alt={`Page ${currentPage}`}
                                    fill
                                    className={`object-cover ${isViewLocked ? 'blur-md opacity-50' : ''} transition-transform duration-1000 group-hover:scale-105`}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                    <span className="text-6xl opacity-20">🎨</span>
                                </div>
                            )}

                            {/* Locking Overlay on Image */}
                            {isViewLocked && <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>}
                        </div>

                        {/* RIGHT: TEXT */}
                        <div className="w-full md:w-1/2 h-1/2 md:h-full p-8 md:p-16 flex flex-col justify-center relative">

                            {isViewLocked ? (
                                <div className="text-center p-8">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">L'aventure continue... 🔒</h3>
                                    <p className="text-gray-600 mb-6">Débloquez l'histoire complète pour voir la suite.</p>
                                    <button onClick={onUnlock} className="py-3 px-8 bg-orange-500 text-white font-bold rounded-full shadow-lg hover:scale-105 transition-transform">
                                        Voir la suite
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="absolute top-8 right-8 text-gray-300 font-mono text-xs">Page {currentPage}</div>

                                    {isEditable && onTextChange ? (
                                        <div className="relative w-full h-full flex flex-col">
                                            <div className="mb-2 flex justify-between items-center text-xs font-bold text-orange-500 uppercase tracking-wide">
                                                <span>Texte de l'histoire</span>
                                                <span className="bg-orange-100 px-2 py-1 rounded">✏️ Mode Édition</span>
                                            </div>
                                            <textarea
                                                value={pages[currentPage - 1]?.text}
                                                onChange={(e) => onTextChange(currentPage - 1, e.target.value)}
                                                className="w-full h-full p-6 bg-white/50 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none resize-none font-serif text-lg leading-loose text-gray-800 transition-all"
                                                placeholder="Écrivez l'histoire ici..."
                                            />
                                        </div>
                                    ) : (
                                        <div className="prose prose-lg text-gray-800 font-serif leading-loose">
                                            <span className="text-orange-400 font-bold text-6xl float-left mr-4 -mt-2 leading-none">
                                                {pages[currentPage - 1]?.text?.charAt(0)}
                                            </span>
                                            {pages[currentPage - 1]?.text?.substring(1)}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- CONTROLS --- */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-30 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-lg border border-gray-100">
                <button onClick={handlePrev} disabled={currentPage === 0} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-600 flex items-center justify-center disabled:opacity-30 transition-colors">←</button>
                <div className="text-sm font-mono font-bold text-gray-500">
                    {currentPage === 0 ? "COUV" : `${currentPage} / ${totalPages}`}
                </div>
                <button onClick={handleNext} disabled={currentPage === totalPages || isViewLocked} className="w-10 h-10 rounded-full bg-gray-900 text-white hover:bg-orange-600 flex items-center justify-center disabled:opacity-30 transition-colors">→</button>
            </div>
        </div>
    );
}
