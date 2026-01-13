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
    // Paywall: Unlocked if book is purchased (is_unlocked) OR user is Club member
    const isUnlocked = book?.is_unlocked || (user?.subscription_tier === 'club');

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

    // Soft Paywall: Lock from Page 3 (Index 2 - Partial Generation Mode)
    // currentPage 0=Cover, 1=Page 1.
    // So visible: Cover (0), Page 1 (1). Locked: Page 2+ (2 onwards).
    const isViewLocked = !isUnlocked && currentPage >= 2;

    // --- RENDER HELPERS ---

    // 1. Mobile View (Vertical Scroll of All Pages)
    const MobileView = () => (
        <div className="md:hidden w-full overflow-y-auto pb-32 space-y-8 p-4">
            {/* Cover */}
            <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden p-2 flex flex-col items-center text-center border-4 border-orange-100">
                <div className="w-full aspect-square relative rounded-2xl overflow-hidden shadow-lg border-2 border-white mb-2">
                    {book.cover_url ? (
                        <Image src={book.cover_url} alt="Cover" fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full bg-orange-100 flex items-center justify-center text-2xl">📖</div>
                    )}

                    {/* CSS Overlay Title */}
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <h1 className="text-4xl font-black text-white font-serif drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-center leading-tight" style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                            {book.title}
                        </h1>
                    </div>
                </div>
                <p className="text-gray-600 italic mt-2">Pour {book.child_name}</p>
            </div>

            {/* Pages List */}
            {pages.map((page, index) => {
                const isLocked = !isUnlocked && (index + 1) >= 4; // Page 1 is index 0
                return (
                    <div key={index} className="bg-white rounded-[2rem] shadow-sm border border-[#E0D0B0] overflow-hidden">
                        {/* Image Area */}
                        <div className="aspect-square relative bg-gray-100">
                            {page.image ? (
                                <Image
                                    src={page.image}
                                    alt={`Page ${index + 1}`}
                                    fill
                                    className={`object-cover ${isLocked ? 'blur-md opacity-50' : ''}`}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    <span className="text-4xl animate-pulse">🎨</span>
                                </div>
                            )}
                            {/* Watermark */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                                <span className="font-black text-white text-2xl -rotate-12 uppercase tracking-widest drop-shadow-md">Kusoma Kids</span>
                            </div>
                        </div>

                        {/* Text Area */}
                        <div className="p-6 relative">
                            <span className="absolute top-4 right-4 text-xs font-bold text-gray-300">Page {index + 1}</span>

                            {isLocked ? (
                                <div className="text-center py-8">
                                    <h3 className="font-bold text-gray-900 mb-2">La suite est magique ! ✨</h3>
                                    <button onClick={onUnlock} className="bg-orange-500 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg">
                                        Débloquer l'histoire
                                    </button>
                                </div>
                            ) : (
                                isEditable && onTextChange ? (
                                    <textarea
                                        value={page.text}
                                        onChange={(e) => onTextChange(index, e.target.value)}
                                        className="w-full h-40 p-3 bg-orange-50/50 rounded-xl border border-orange-200 text-gray-800 font-serif leading-relaxed focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                ) : (
                                    <p className="font-serif text-lg text-gray-800 leading-relaxed">
                                        <span className="text-orange-500 font-bold text-3xl float-left mr-2 leading-none">{page.text?.charAt(0)}</span>
                                        {page.text?.substring(1)}
                                    </p>
                                )
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    // 2. Desktop View (Carousel)
    const DesktopView = () => (
        <div className="hidden md:flex relative w-full h-full bg-[#FDFBF7] overflow-hidden flex-col md:flex-row shadow-2xl rounded-[2rem] border-4 border-[#F0E6D2] m-8 max-w-[95%] max-h-[90%]">
            {/* Paper Texture */}
            <div className="absolute inset-0 opacity-30 pointer-events-none z-0 mix-blend-multiply" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper.png")' }}></div>

            {/* Navigation Buttons (Desktop Only - Centered on Edges) */}
            <>
                <button
                    onClick={handlePrev}
                    disabled={currentPage === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/80 backdrop-blur shadow-xl border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-orange-500 hover:text-white transition-all disabled:opacity-0 disabled:pointer-events-none group"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                </button>
                <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages || isViewLocked}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/80 backdrop-blur shadow-xl border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-orange-500 hover:text-white transition-all disabled:opacity-0 disabled:pointer-events-none group"
                >
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
            </>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {currentPage === 0 ? (
                    <motion.div
                        key="cover"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full h-full flex flex-col items-center justify-center p-8 relative z-10"
                    >
                        <div className="w-[500px] h-[500px] relative rounded-3xl overflow-hidden shadow-2xl border-[8px] border-white mb-8 group transform hover:scale-105 transition-transform duration-500">
                            {book.cover_url ? (
                                <Image src={book.cover_url} alt="Cover" fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full bg-orange-100 flex items-center justify-center text-6xl">📖</div>
                            )}

                            {/* CSS Overlay Title (Desktop) */}
                            <div className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-t from-black/20 via-transparent to-transparent">
                                <h1 className="text-6xl font-black text-white font-serif text-center leading-tight drop-shadow-2xl"
                                    style={{
                                        textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                                        fontFamily: '"Fredoka", sans-serif' // Explicitly trying Fredoka if available
                                    }}>
                                    {book.title}
                                </h1>
                            </div>
                        </div>
                        <p className="text-2xl text-gray-600 italic font-serif">Une aventure pour {book.child_name}</p>
                    </motion.div>
                ) : (
                    <motion.div
                        key={currentPage}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full h-full flex flex-row relative z-10"
                    >
                        {/* Left: Image */}
                        <div className="w-1/2 h-full relative bg-gray-100 border-r border-[#E0D0B0] overflow-hidden">
                            {pages[currentPage - 1]?.image ? (
                                <Image
                                    src={pages[currentPage - 1].image}
                                    alt={`Page ${currentPage}`}
                                    fill
                                    className={`object-cover ${isViewLocked ? 'blur-lg opacity-50' : ''}`}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center flex-col text-gray-400">
                                    <span className="text-6xl animate-bounce mb-4">🎨</span>
                                    <p>Création en cours...</p>
                                </div>
                            )}
                            {/* Watermark */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
                                <span className="text-white font-black text-6xl -rotate-12 uppercase tracking-widest drop-shadow-lg mix-blend-overlay">Kusoma Kids</span>
                            </div>
                        </div>

                        {/* Right: Text */}
                        <div className="w-1/2 h-full p-20 flex flex-col justify-center bg-white/60 relative">
                            <span className="absolute top-8 right-8 text-gray-300 font-bold font-mono">PAGE {currentPage}</span>

                            {isViewLocked ? (
                                <div className="text-center">
                                    <h3 className="text-3xl font-bold text-gray-900 mb-4">L'aventure continue... 🔒</h3>
                                    <button onClick={onUnlock} className="px-8 py-3 bg-orange-500 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
                                        Rejoindre le Club
                                    </button>
                                </div>
                            ) : isEditable && onTextChange ? (
                                <textarea
                                    value={pages[currentPage - 1]?.text}
                                    onChange={(e) => onTextChange(currentPage - 1, e.target.value)}
                                    className="w-full h-3/4 p-6 bg-white/80 rounded-2xl border-2 border-orange-100 focus:border-orange-400 text-xl font-serif leading-relaxed text-gray-800 outline-none resize-none shadow-inner"
                                />
                            ) : (
                                <div className="prose prose-xl font-serif text-gray-800">
                                    <span className="text-7xl float-left mr-4 text-orange-500 font-bold leading-[0.8]">{pages[currentPage - 1]?.text?.charAt(0)}</span>
                                    {pages[currentPage - 1]?.text?.substring(1)}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <div className="w-full h-full flex items-center justify-center bg-[#FDFBF7]">
            <MobileView />
            <DesktopView />
        </div>
    );
}
