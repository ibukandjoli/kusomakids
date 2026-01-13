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
        <div className="md:hidden w-full overflow-y-auto pb-32 space-y-8 p-4 bg-[#FDFBF7]">
            {/* Cover */}
            <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden p-2 flex flex-col items-center text-center border-4 border-orange-100 relative">
                <div className="w-full aspect-square relative rounded-2xl overflow-hidden shadow-lg border-2 border-white mb-2 bg-orange-50">
                    {book.cover_url ? (
                        <Image src={book.cover_url} alt="Cover" fill className="object-cover" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center flex-col text-orange-300 animate-pulse">
                            <span className="text-4xl mb-2">✨</span>
                            <span className="text-xs font-bold uppercase">Création en cours...</span>
                        </div>
                    )}

                    {/* CSS Overlay Title */}
                    <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/10">
                        <h1 className="text-2xl md:text-3xl font-black text-white font-serif text-center leading-tight drop-shadow-md"
                            style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                            {book.title}
                        </h1>
                    </div>
                </div>
                <p className="text-gray-600 italic mt-2 mb-1 font-serif text-sm">Une aventure pour <span className="font-bold">{book.child_name}</span></p>
            </div>

            {/* Pages List */}
            {pages.map((page, index) => {
                const isPageLocked = !isUnlocked && (index + 1) >= 3; // Lock from Page 3 onwards (Hybrid Mode)
                return (
                    <div key={index} className="bg-white rounded-[2rem] shadow-sm border border-[#E0D0B0] overflow-hidden">
                        {/* Image Area */}
                        <div className="aspect-[4/3] relative bg-gray-100 border-b border-[#F0E6D2]">
                            {page.image ? (
                                <Image
                                    src={page.image}
                                    alt={`Page ${index + 1}`}
                                    fill
                                    className={`object-cover ${isPageLocked ? 'blur-xl opacity-60' : ''}`}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    <span className="text-4xl animate-pulse">🎨</span>
                                </div>
                            )}

                            {/* Lock Overlay */}
                            {isPageLocked && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px] p-4 text-center">
                                    <div className="bg-white/90 p-3 rounded-full shadow-lg mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="text-white font-bold text-sm drop-shadow-md px-4 py-1 bg-black/40 rounded-full">
                                        Illustration générée après paiement
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Text Area (ALWAYS VISIBLE) */}
                        <div className="p-6 relative">
                            <span className="absolute top-4 right-4 text-xs font-bold text-gray-300">Page {index + 1}</span>

                            {isEditable && onTextChange ? (
                                <textarea
                                    value={page.text}
                                    onChange={(e) => onTextChange(index, e.target.value)}
                                    className="w-full h-40 p-4 bg-orange-50/30 rounded-xl border border-orange-100 text-gray-800 font-serif text-lg leading-relaxed focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                                />
                            ) : (
                                <p className="font-serif text-lg text-gray-800 leading-relaxed">
                                    <span className="text-orange-500 font-bold text-3xl float-left mr-2 leading-none">{page.text?.charAt(0)}</span>
                                    {page.text?.substring(1)}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    // 2. Desktop View (Cinema Mode)
    const DesktopView = () => (
        <div className="hidden md:flex relative w-full h-full bg-[#FDFBF7] overflow-hidden flex-col md:flex-row shadow-2xl rounded-[1rem] border border-[#F0E6D2] m-4 max-w-[95%] max-h-[90%]">

            {/* Navigation Buttons */}
            <>
                <button
                    onClick={handlePrev}
                    disabled={currentPage === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/90 shadow-xl border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-orange-500 hover:text-white transition-all disabled:opacity-0 disabled:pointer-events-none group"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                </button>
                <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages} // Allow going to end even if locked
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/90 shadow-xl border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-orange-500 hover:text-white transition-all disabled:opacity-0 disabled:pointer-events-none group"
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
                        className="w-full h-full flex flex-col items-center justify-center p-8 relative z-10 bg-[url('/images/pattern_bg.png')] bg-repeat"
                    >
                        <div className="w-[500px] h-[500px] relative rounded-3xl overflow-hidden shadow-2xl border-[12px] border-white mb-8 group transform hover:scale-[1.02] transition-transform duration-700 bg-orange-50">
                            {book.cover_url ? (
                                <Image src={book.cover_url} alt="Cover" fill className="object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center flex-col text-orange-300 animate-pulse">
                                    <span className="text-6xl mb-4">✨</span>
                                    <span className="text-lg font-bold uppercase">Création de la couverture...</span>
                                </div>
                            )}

                            {/* CSS Overlay Title (Desktop) */}
                            <div className="absolute inset-0 flex items-center justify-center p-12 bg-black/10">
                                <h1 className="text-5xl font-black text-white font-serif text-center leading-tight drop-shadow-2xl"
                                    style={{
                                        textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                                    }}>
                                    {book.title}
                                </h1>
                            </div>
                        </div>
                        <div className="bg-white px-8 py-3 rounded-full shadow-lg border border-orange-100">
                            <p className="text-xl text-gray-600 italic font-serif">Une aventure magique écrite pour <span className="text-orange-600 font-bold">{book.child_name}</span></p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key={currentPage}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full h-full flex flex-row relative z-10"
                    >
                        {/* LEFT: Image (Locked or Unlocked) */}
                        <div className="w-1/2 h-full relative bg-gray-100 border-r border-[#E0D0B0] overflow-hidden group">
                            {/* Page Index 0 is Page 1 */}
                            {pages[currentPage - 1]?.image ? (
                                <Image
                                    src={pages[currentPage - 1].image}
                                    alt={`Page ${currentPage}`}
                                    fill
                                    className={`object-cover transition-all duration-700 ${(!isUnlocked && currentPage >= 3) ? 'blur-xl scale-110 opacity-60' : 'group-hover:scale-105'}`}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center flex-col text-gray-400">
                                    <span className="text-6xl animate-bounce mb-4">🎨</span>
                                    <p>Illustration en cours...</p>
                                </div>
                            )}

                            {/* Hybrid Lock Overlay */}
                            {(!isUnlocked && currentPage >= 3) && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/20">
                                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-center shadow-xl">
                                        <div className="w-16 h-16 bg-white text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-2xl">
                                            🔒
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md">Illustration Verrouillée</h3>
                                        <p className="text-white/90 text-sm font-medium drop-shadow-sm">Sera générée en haute qualité après paiement</p>
                                    </div>
                                </div>
                            )}

                            {/* Watermark */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
                                <span className="text-white font-black text-6xl -rotate-12 uppercase tracking-widest drop-shadow-lg mix-blend-overlay">Kusoma Kids</span>
                            </div>
                        </div>

                        {/* RIGHT: Text (Always Editable) */}
                        <div className="w-1/2 h-full p-16 flex flex-col justify-center bg-[#FFFEFA] relative shadow-inner">
                            <span className="absolute top-8 right-8 text-gray-300 font-bold font-mono">PAGE {currentPage}</span>

                            {isEditable && onTextChange ? (
                                <div className="relative group">
                                    <div className="absolute -top-10 left-0 bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                        <span>✏️</span> Vous pouvez modifier ce texte
                                    </div>
                                    <textarea
                                        value={pages[currentPage - 1]?.text}
                                        onChange={(e) => onTextChange(currentPage - 1, e.target.value)}
                                        className="w-full h-[60vh] p-6 bg-transparent rounded-2xl border-2 border-transparent hover:border-orange-100 focus:border-orange-300 focus:bg-white text-2xl font-serif leading-relaxed text-gray-800 outline-none resize-none transition-all placeholder:text-gray-300"
                                        style={{ fontFamily: '"Georgia", serif' }} // Using Georgia as safe fallback for book font
                                        spellCheck="false"
                                    />
                                </div>
                            ) : (
                                <div className="prose prose-2xl font-serif text-gray-800 leading-relaxed">
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
