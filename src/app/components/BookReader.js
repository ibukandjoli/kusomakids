'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookReader({ book, user, onUnlock, isEditable = false, onTextChange, extraPages = [], enableAudio = true, showFullscreen = true }) {
    const [currentPage, setCurrentPage] = useState(0); // 0 = Cover
    const [isFullscreen, setIsFullscreen] = useState(false);
    const readerRef = useRef(null);

    // Normalize pages to objects { text, image }
    const dbContent = book.story_content || {};
    const dbPages = Array.isArray(dbContent) ? dbContent : (dbContent.pages || []);
    const rawPages = extraPages.length > 0 ? extraPages : dbPages;
    const pages = rawPages.map(p => typeof p === 'string' ? { text: p, image: null } : p);

    const coverUrl = book.cover_image_url || book.cover_url || pages?.[0]?.image;
    const totalPages = pages.length;

    // Access Logic
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

    const isViewLocked = !isUnlocked && currentPage >= 2;

    // Helper to personalize text
    const personalize = (text) => {
        if (!text) return '';
        const name = book.child_name || 'Votre Enfant';
        return text
            .replace(/\[Son prénom\]/gi, name)
            .replace(/\{childName\}/gi, name);
    };

    // 1. Mobile View (Vertical Scroll)
    const MobileView = () => (
        <div className="md:hidden w-full h-full overflow-y-auto pb-20 space-y-6 p-4 bg-gradient-to-b from-orange-50 to-white">
            {/* Cover */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="w-full aspect-square relative">
                    {coverUrl ? (
                        <Image src={coverUrl} alt="Cover" fill className="object-cover" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center flex-col text-orange-300 animate-pulse">
                            <span className="text-4xl mb-2">✨</span>
                            <span className="text-xs font-bold">Création...</span>
                        </div>
                    )}

                    {/* Title Overlay - SMALLER */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent p-4 flex items-start justify-center">
                        <h1 className="text-xl font-bold text-white text-center drop-shadow-lg mt-4">
                            {personalize(book.title)}
                        </h1>
                    </div>
                </div>
                <div className="p-4 text-center">
                    <p className="text-sm text-gray-600 italic">
                        Une aventure pour <span className="font-bold text-orange-600">{book.child_name}</span>
                    </p>
                </div>
            </div>

            {/* Pages */}
            {pages.map((page, index) => {
                const isPageLocked = !isUnlocked && (index + 1) >= 3;
                return (
                    <div key={index} className="bg-white rounded-2xl shadow-md overflow-hidden">
                        {/* Image */}
                        <div className="aspect-[4/3] relative bg-gray-100">
                            {page.image ? (
                                <Image
                                    src={page.image}
                                    alt={`Page ${index + 1}`}
                                    fill
                                    className={`object-cover ${isPageLocked ? 'blur-lg opacity-50' : ''}`}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    <span className="text-4xl animate-pulse">🎨</span>
                                </div>
                            )}

                            {/* Lock Overlay */}
                            {isPageLocked && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                                    <div className="bg-white/95 p-4 rounded-2xl shadow-xl text-center">
                                        <div className="text-3xl mb-2">🔒</div>
                                        <p className="text-sm font-bold text-gray-800">Débloquez pour voir</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Text */}
                        <div className="p-6">
                            <span className="text-xs font-bold text-gray-400 mb-2 block">Page {index + 1}</span>
                            {isEditable && onTextChange ? (
                                <textarea
                                    value={page.text}
                                    onChange={(e) => onTextChange(index, e.target.value)}
                                    className="w-full h-32 p-3 bg-orange-50/30 rounded-lg border border-orange-100 text-gray-800 text-base leading-relaxed focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                                />
                            ) : (
                                <p className="text-base text-gray-800 leading-relaxed">
                                    {page.text}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    // 2. Desktop View (Full Screen - NO BLACK BARS)
    const DesktopView = () => (
        <div className="hidden md:flex w-full h-screen bg-white overflow-hidden relative">
            {/* Navigation Buttons */}
            <button
                onClick={handlePrev}
                disabled={currentPage === 0}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center text-gray-700 hover:bg-orange-500 hover:text-white transition-all disabled:opacity-0 disabled:pointer-events-none"
            >
                ←
            </button>
            <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-50 w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center text-gray-700 hover:bg-orange-500 hover:text-white transition-all disabled:opacity-0 disabled:pointer-events-none"
            >
                →
            </button>

            {/* Content */}
            <AnimatePresence mode="wait">
                {currentPage === 0 ? (
                    <motion.div
                        key="cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-white relative"
                    >
                        {/* Cover Image - Centered & Larger (Responsive) */}
                        <div className="relative w-[75vh] h-[75vh] max-w-[800px] max-h-[800px] shadow-2xl rounded-3xl overflow-hidden">
                            {coverUrl ? (
                                <Image src={coverUrl} alt="Cover" fill className="object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center flex-col text-orange-300 animate-pulse">
                                    <span className="text-6xl mb-4">✨</span>
                                    <span className="text-lg font-bold">Création...</span>
                                </div>
                            )}

                            {/* Title Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent p-8 flex items-start justify-center">
                                <h1 className="text-3xl font-bold text-white text-center drop-shadow-2xl mt-8 max-w-md">
                                    {personalize(book.title)}
                                </h1>
                            </div>
                        </div>

                        {/* Subtitle */}
                        <div className="absolute bottom-10 bg-white px-8 py-4 rounded-full shadow-lg z-10">
                            <p className="text-lg text-gray-600 italic">
                                Une aventure pour <span className="text-orange-600 font-bold">{book.child_name}</span>
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key={currentPage}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex"
                    >
                        {/* LEFT: Image (50%) */}
                        <div className="w-1/2 h-full relative bg-gray-100">
                            {(() => {
                                const pageData = pages[currentPage - 1];
                                const imageUrl = pageData?.image || pageData?.image_url || pageData?.imageUrl || coverUrl;
                                const hasImage = !!(pageData?.image || pageData?.image_url || pageData?.imageUrl);

                                if (hasImage || (!isUnlocked && currentPage >= 3)) {
                                    return (
                                        <Image
                                            src={imageUrl}
                                            alt={`Page ${currentPage}`}
                                            fill
                                            className={`object-cover ${(!isUnlocked && currentPage >= 3) ? 'blur-md opacity-50' : ''}`}
                                        />
                                    );
                                } else {
                                    return (
                                        <div className="absolute inset-0 flex items-center justify-center flex-col text-gray-400">
                                            <span className="text-6xl animate-bounce mb-4">🎨</span>
                                            <p>Illustration en cours...</p>
                                        </div>
                                    );
                                }
                            })()}

                            {/* Lock Overlay */}
                            {(!isUnlocked && currentPage >= 3) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
                                    <div className="bg-white/95 p-6 rounded-3xl shadow-2xl text-center">
                                        <div className="text-5xl mb-3">🔒</div>
                                        <p className="text-gray-900 font-bold">Illustration à débloquer</p>
                                    </div>
                                </div>
                            )}

                            {/* Watermark */}
                            {!isUnlocked && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                                    <span className="text-white font-black text-4xl -rotate-12 uppercase">Kusoma Kids</span>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Text (50%) */}
                        <div className="w-1/2 h-full flex flex-col items-center justify-center bg-white p-12 relative">
                            <span className="absolute top-6 right-6 text-gray-400 text-sm font-bold">PAGE {currentPage}</span>

                            {isEditable && onTextChange ? (
                                <textarea
                                    value={pages[currentPage - 1]?.text}
                                    onChange={(e) => onTextChange(currentPage - 1, e.target.value)}
                                    // WIDENED TEXT AREA
                                    className="w-full max-w-3xl h-[60vh] p-6 bg-orange-50/20 rounded-2xl border-2 border-orange-100 text-xl text-gray-800 leading-relaxed focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                                />
                            ) : (
                                <div className="max-w-3xl text-center">
                                    <p className="text-2xl text-gray-800 leading-relaxed">
                                        {pages[currentPage - 1]?.text}
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
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const audioRef = useRef(null);

    const handlePlayAudio = async () => {
        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
            return;
        }

        const currentPageData = pages[currentPage > 0 ? currentPage - 1 : 0];
        const textToRead = currentPage === 0
            ? `${book.title}. ${book.tagline || ''}`
            : currentPageData?.text;

        if (!textToRead) return;

        let audioUrl = currentPageData?.audio_url;

        if (!audioUrl) {
            try {
                setIsAudioLoading(true);

                const res = await fetch('/api/audio/generate-speech', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: textToRead,
                        bookId: book.id,
                        pageIndex: currentPage > 0 ? currentPage - 1 : 0
                    })
                });

                const data = await res.json();
                setIsAudioLoading(false);

                if (!res.ok) {
                    console.error("Audio Error:", data);
                    alert("Impossible de générer l'audio pour le moment.");
                    return;
                }

                audioUrl = data.audioUrl;

                if (currentPage > 0) {
                    currentPageData.audio_url = audioUrl;
                }

            } catch (e) {
                setIsAudioLoading(false);
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
        <div ref={readerRef} className="w-full h-full bg-white overflow-hidden relative">
            {/* Audio Button */}
            {enableAudio && (
                <button
                    onClick={handlePlayAudio}
                    disabled={isAudioLoading}
                    className={`absolute top-6 right-6 z-50 bg-white shadow-xl p-3 rounded-full transition-all hover:scale-110 ${isPlaying ? 'text-orange-500 ring-2 ring-orange-500' : 'text-gray-600'} ${isAudioLoading ? 'opacity-70' : ''}`}
                    title="Écouter l'histoire"
                >
                    {isAudioLoading ? (
                        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : isPlaying ? (
                        <span className="text-xl">🔊</span>
                    ) : (
                        <span className="text-xl">🔈</span>
                    )}
                </button>
            )}

            {/* Fullscreen Button */}
            {showFullscreen && (
                <button
                    onClick={toggleFullscreen}
                    className="absolute top-6 right-20 z-50 p-3 bg-white rounded-full shadow-xl transition-all hover:scale-110"
                    title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
                >
                    {isFullscreen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                    )}
                </button>
            )}

            {/* Mobile View */}
            <MobileView />

            {/* Desktop View */}
            <DesktopView />
        </div>
    );
}
