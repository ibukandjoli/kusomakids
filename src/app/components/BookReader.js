'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookReader({ book, user, onUnlock, isEditable = false, onTextChange, extraPages = [], enableAudio = true }) {
    const [currentPage, setCurrentPage] = useState(0); // 0 = Cover
    const [isFullscreen, setIsFullscreen] = useState(false);
    const readerRef = useRef(null);

    // Normalize pages to objects { text, image }
    // If passed via extraPages (for Preview), use that. Else use book.story_content.pages or book.story_content (if array).
    const dbContent = book.story_content || {};
    const dbPages = Array.isArray(dbContent) ? dbContent : (dbContent.pages || []);
    const rawPages = extraPages.length > 0 ? extraPages : dbPages;
    const pages = rawPages.map(p => typeof p === 'string' ? { text: p, image: null } : p);

    const coverUrl = book.cover_image_url || book.cover_url || pages?.[0]?.image;

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
                    {coverUrl ? (
                        <Image src={coverUrl} alt="Cover" fill className="object-cover" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center flex-col text-orange-300 animate-pulse">
                            <span className="text-4xl mb-2">✨</span>
                            <span className="text-xs font-bold uppercase">Création...</span>
                        </div>
                    )}

                    {/* CSS Overlay Title (Mobile) - Top Position */}
                    <div className="absolute top-0 left-0 right-0 p-4 pt-8 flex justify-center bg-gradient-to-b from-black/20 to-transparent">
                        <h1 className="text-3xl md:text-4xl font-black text-white font-[var(--font-fredoka)] text-center leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transform -rotate-1">
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
                            {coverUrl ? (
                                <Image src={coverUrl} alt="Cover" fill className="object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center flex-col text-orange-300 animate-pulse">
                                    <span className="text-6xl mb-4">✨</span>
                                    <span className="text-lg font-bold uppercase">Création de la couverture...</span>
                                </div>
                            )}

                            {/* CSS Overlay Title (Desktop) - REFINED TOP POSITION */}
                            <div className="absolute top-0 left-0 right-0 pt-10 px-12 flex justify-center z-20">
                                <h1 className="text-4xl lg:text-5xl font-black text-white font-[var(--font-fredoka)] text-center leading-tight drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] tracking-wide transform -rotate-1">
                                    {book.title}
                                </h1>
                            </div>
                        </div>
                        <div className="bg-white px-8 py-3 rounded-full shadow-lg border border-orange-100 z-20 relative">
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
                            {(pages[currentPage - 1]?.image || (!isUnlocked && currentPage >= 3)) ? (
                                <Image
                                    src={pages[currentPage - 1]?.image || coverUrl} // Use Cover if locked/missing
                                    alt={`Page ${currentPage}`}
                                    fill
                                    className={`object-cover transition-all duration-700 ${(!isUnlocked && currentPage >= 3) ? 'blur-md scale-110 opacity-50' : 'group-hover:scale-105'}`}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center flex-col text-gray-400">
                                    <span className="text-6xl animate-bounce mb-4">🎨</span>
                                    <p>Illustration en cours...</p>
                                </div>
                            )}

                            {/* Hybrid Lock Overlay */}
                            {(!isUnlocked && currentPage >= 3) && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/10 backdrop-blur-[4px]">
                                    <div className="bg-white/90 p-5 rounded-3xl border border-white/50 text-center shadow-xl backdrop-blur-md">
                                        <div className="w-14 h-14 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg text-2xl">
                                            🔒
                                        </div>
                                        <p className="text-gray-900 font-bold text-sm">Illustration à débloquer</p>
                                    </div>
                                </div>
                            )}

                            {/* Watermark */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                                <span className="text-white font-black text-5xl -rotate-12 uppercase tracking-widest drop-shadow-lg mix-blend-overlay">Kusoma Kids</span>
                            </div>
                        </div>

                        {/* RIGHT: Text (Always Editable & Centered) */}
                        <div className="w-1/2 h-full flex flex-col items-center justify-center bg-[#FFFEFA] relative shadow-inner p-10">
                            <span className="absolute top-6 right-6 text-gray-400 text-xs font-bold font-mono tracking-widest uppercase">PAGE {currentPage}</span>

                            {isEditable && onTextChange ? (
                                <div className="relative group w-full max-w-md my-auto">
                                    <div className="absolute -top-8 left-0 text-orange-400 text-xs font-bold uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                        <span>✏️</span> Modifier le texte
                                    </div>
                                    <textarea
                                        value={pages[currentPage - 1]?.text}
                                        onChange={(e) => onTextChange(currentPage - 1, e.target.value)}
                                        className="w-full h-[50vh] p-0 bg-transparent rounded-none border-none text-2xl text-center font-serif leading-relaxed text-gray-800 outline-none resize-none placeholder:text-gray-300 focus:ring-0 flex items-center justify-center"
                                        style={{ fontFamily: '"Georgia", serif' }}
                                        spellCheck="false"
                                    />
                                </div>
                            ) : (
                                <div className="prose prose-2xl font-serif text-gray-800 leading-relaxed max-w-lg text-center flex flex-col justify-center h-full">
                                    <p>
                                        <span className="text-7xl text-orange-500 font-bold leading-[0.8] align-middle mr-2">{pages[currentPage - 1]?.text?.charAt(0)}</span>
                                        {pages[currentPage - 1]?.text?.substring(1)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    // Audio Logic
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    const handlePlayAudio = async () => {
        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
            return;
        }

        const currentPageData = pages[currentPage > 0 ? currentPage - 1 : 0]; // Handle Cover (0) vs Pages
        const textToRead = currentPage === 0 ? book.title : currentPageData?.text;

        if (!textToRead) return;

        // Check if audio URL already exists
        let audioUrl = currentPageData?.audio_url;

        // If not, call API to generate (and cache)
        if (!audioUrl) {
            try {
                // Show loading state (optimistic or spinner)
                // For now, change cursor or visual cue
                document.body.style.cursor = 'wait';

                const res = await fetch('/api/audio/generate-speech', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: textToRead,
                        bookId: book.id, // Ensure book object has ID
                        pageIndex: currentPage > 0 ? currentPage - 1 : 0 // 0 for Cover, etc.
                    })
                });

                const data = await res.json();
                document.body.style.cursor = 'default';

                if (!res.ok) {
                    console.error("Audio Error:", data);
                    alert("Erreur lors de la génération audio. Vérifiez votre connexion.");
                    return;
                }

                audioUrl = data.audioUrl;

                // Optimistic Update (Optional: Update local pages array so we don't fetch again this session)
                // We should ideally update the parent's state, but for this component:
                if (currentPage > 0) {
                    pages[currentPage - 1].audio_url = audioUrl;
                }

            } catch (e) {
                document.body.style.cursor = 'default';
                console.error(e);
                return;
            }
        }

        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.play();
            setIsPlaying(true);
            audio.onended = () => setIsPlaying(false);
        }
    };

    // Fullscreen Logic
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            readerRef.current?.requestFullscreen().then(() => {
                setIsFullscreen(true);
            }).catch(err => {
                console.error('Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false);
            });
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <div ref={readerRef} className="w-full h-full flex flex-col md:items-center md:justify-center bg-[#FDFBF7] overflow-hidden relative">

            {/* Audio Button (Floating) */}
            {enableAudio && (
                <button
                    onClick={handlePlayAudio}
                    className={`absolute top-20 right-4 z-50 md:top-8 md:right-8 bg-white/90 backdrop-blur shadow-xl border border-gray-100 p-3 rounded-full transition-all hover:scale-110 group ${isPlaying ? 'text-orange-500 ring-2 ring-orange-500' : 'text-gray-600'}`}
                    title="Écouter l'histoire"
                >
                    {isPlaying ? (
                        <span className="animate-pulse">🔊</span>
                    ) : (
                        <span>🔈</span>
                    )}
                    <span className="absolute right-full mr-2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {isPlaying ? 'Pause' : 'Écouter'}
                    </span>
                </button>
            )}

            {/* Fullscreen Button */}
            <button
                onClick={toggleFullscreen}
                className="absolute top-20 right-20 z-50 md:top-8 md:right-24 bg-white/90 backdrop-blur shadow-xl border border-gray-100 p-3 rounded-full transition-all hover:scale-110 group text-gray-600"
                title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            >
                {isFullscreen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                )}
                <span className="absolute right-full mr-2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {isFullscreen ? 'Quitter' : 'Plein écran'}
                </span>
            </button>

            {/* Mobile: Scrollable container handles its own overflow */}
            <div className="md:hidden w-full h-full overflow-y-auto">
                <MobileView />
            </div>

            {/* Desktop: Centered fixed view */}
            <DesktopView />
        </div>
    );
}
