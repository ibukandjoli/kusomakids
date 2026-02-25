'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

export default function BookReader({ book, user, onUnlock, isEditable = false, onTextChange, extraPages = [], enableAudio = true, showFullscreen = true }) {
    const [currentPage, setCurrentPage] = useState(0); // 0 = Cover
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [direction, setDirection] = useState(1);
    const readerRef = useRef(null);
    const audioRef = useRef(null); // Ref for our hidden audio element

    // Normalize pages — merge DB content + extraPages
    const dbContent = book.story_content || book.content_json || {};
    const dbPages = Array.isArray(dbContent) ? dbContent : (dbContent.pages || []);
    const rawPages = (Array.isArray(dbContent.pages) ? dbContent.pages : dbPages);

    const normalizedDbPages = rawPages.map(p => {
        if (typeof p === 'string') return { text: p, image: null };
        return { ...p, image: p.image || p.image_url || p.imageUrl || null };
    });

    // Use extraPages if DB pages are empty (preview/generation mode)
    const normalizedExtraPages = extraPages.map(p => {
        if (typeof p === 'string') return { text: p, image: null };
        return { ...p, image: p.image || p.image_url || p.imageUrl || null };
    });

    const [normalizedPages, setNormalizedPages] = useState(
        normalizedDbPages.length > 0 ? normalizedDbPages : normalizedExtraPages
    );

    const pages = normalizedPages;

    const coverUrl = book.cover_image_url || book.cover_url || pages?.[0]?.image;
    const totalPages = pages.length;
    const isUnlocked = book?.is_unlocked || (user?.subscription_tier === 'club');

    const handleNext = useCallback(() => {
        if (currentPage < totalPages) {
            setDirection(1);
            setCurrentPage(prev => prev + 1);
        }
    }, [currentPage, totalPages]);

    const handlePrev = useCallback(() => {
        if (currentPage > 0) {
            setDirection(-1);
            setCurrentPage(prev => prev - 1);
        }
    }, [currentPage]);

    // Helper to personalize text
    const personalize = (text) => {
        if (!text) return '';
        const name = book.child_name || 'Votre Enfant';
        return text
            .replace(/\[Son prénom\]/gi, name)
            .replace(/\{childName\}/gi, name);
    };

    // ============ AUDIO — Premium OpenAI TTS ============
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioLoading, setAudioLoading] = useState(false);
    const [coverAudioUrl, setCoverAudioUrl] = useState(book?.cover_audio_url || null);

    // Stop audio when changing pages
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setAudioLoading(false);
    }, [currentPage]);

    // Handle end of audio playback
    useEffect(() => {
        const audioEl = audioRef.current;
        if (!audioEl) return;

        const handleEnded = () => setIsPlaying(false);
        const handleError = () => {
            console.error("Audio playback error");
            setIsPlaying(false);
            setAudioLoading(false);
        };

        audioEl.addEventListener('ended', handleEnded);
        audioEl.addEventListener('error', handleError);

        return () => {
            audioEl.removeEventListener('ended', handleEnded);
            audioEl.removeEventListener('error', handleError);
        };
    }, []);

    useEffect(() => {
        let isCancelled = false;

        const prefetchAudio = async () => {
            const isCover = currentPage === 0;
            const actualPageIndex = isCover ? 'cover' : currentPage - 1;
            const currentPageData = isCover ? null : pages[actualPageIndex];
            const existingAudioPath = isCover ? coverAudioUrl : currentPageData?.audio_url;

            if (existingAudioPath || !book?.id || !enableAudio) return;

            const textToRead = isCover
                ? `${personalize(book.title)}. Une histoire pour ${book.child_name || 'votre enfant'}.`
                : personalize(currentPageData?.text);

            if (!textToRead) return;

            // Trigger silent background generation
            try {
                const gRes = await fetch('/api/audio/generate-speech', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: textToRead,
                        bookId: book.id,
                        pageIndex: actualPageIndex,
                        voice: 'nova'
                    })
                });

                if (gRes.ok && !isCancelled) {
                    const data = await gRes.json();
                    if (isCover) {
                        setCoverAudioUrl(data.filePath);
                    } else {
                        setNormalizedPages(prevPages => {
                            const newPages = [...prevPages];
                            if (newPages[actualPageIndex]) {
                                newPages[actualPageIndex].audio_url = data.filePath;
                            }
                            return newPages;
                        });
                    }
                }
            } catch (error) {
                console.error("Silent TTS prefetch failed:", error);
            }
        };

        // Delay pre-fetch slightly so it doesn't block UI animations
        const timer = setTimeout(prefetchAudio, 500);

        return () => {
            isCancelled = true;
            clearTimeout(timer);
        };
    }, [currentPage, book, pages, coverAudioUrl, enableAudio]);

    const handlePlayAudio = async () => {
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }

        const isCover = currentPage === 0;
        const actualPageIndex = isCover ? 'cover' : currentPage - 1;
        const currentPageData = isCover ? null : pages[actualPageIndex];
        const existingAudioPath = isCover ? coverAudioUrl : currentPageData?.audio_url;

        // Determine Text to Synthesize
        const textToRead = isCover
            ? `${personalize(book.title)}. Une histoire pour ${book.child_name || 'votre enfant'}.`
            : personalize(currentPageData?.text);

        if (!textToRead) return;

        setAudioLoading(true);

        try {
            let finalUrlToPlay = null;

            if (existingAudioPath) {
                // Audio exists! We just use the proxy URL
                finalUrlToPlay = `/api/audio/proxy?url=${encodeURIComponent(existingAudioPath)}`;
            } else {
                // Fallback: the silent background pre-fetch hasn't finished, so we wait for generation here
                const gRes = await fetch('/api/audio/generate-speech', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: textToRead,
                        bookId: book.id,
                        pageIndex: actualPageIndex,
                        voice: 'nova'
                    })
                });

                if (!gRes.ok) throw new Error("Failed to generate audio");
                const data = await gRes.json();

                finalUrlToPlay = data.audioUrl;

                // Update local state so subsequent plays don't regenerate
                if (isCover) {
                    setCoverAudioUrl(data.filePath);
                } else {
                    const updatedPages = [...pages];
                    updatedPages[actualPageIndex].audio_url = data.filePath;
                    setNormalizedPages(updatedPages);
                }
            }

            if (audioRef.current && finalUrlToPlay) {
                audioRef.current.src = finalUrlToPlay;
                audioRef.current.play()
                    .then(() => {
                        setIsPlaying(true);
                        setAudioLoading(false);
                    })
                    .catch((err) => {
                        console.error("Playback interrupted or failed", err);
                        setAudioLoading(false);
                        setIsPlaying(false);
                    });
            }

        } catch (err) {
            console.error(err);
            alert("Erreur lors du chargement de l'audio premium.");
            setAudioLoading(false);
        }
    };

    // Fullscreen Logic
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            readerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false));
        }
    };

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') handleNext();
            else if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNext, handlePrev]);

    // Smooth page transition
    const slideVariants = {
        enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
    };

    // Render text with personalize
    const renderText = (text) => {
        if (!text) return null;
        return personalize(text);
    };

    // ========== RENDER ==========
    return (
        <div ref={readerRef} className="w-full h-full bg-[#1a1a2e] overflow-hidden relative select-none">
            {/* Premium Audio Element */}
            <audio ref={audioRef} className="hidden" preload="auto" />

            {/* ============ MOBILE VIEW ============ */}
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

                {/* Audio Button (Mobile) */}
                {enableAudio && (
                    <div className="flex justify-center">
                        <button
                            onClick={handlePlayAudio}
                            className={`px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-md ${isPlaying
                                ? 'bg-orange-500 text-white'
                                : 'bg-white text-gray-700 hover:bg-orange-50'
                                }`}
                        >
                            {audioLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                            ) : isPlaying ? (
                                <span>⏹️ Arrêter</span>
                            ) : (
                                <span>🔊 Écouter cette page</span>
                            )}
                        </button>
                    </div>
                )}

                {/* Pages */}
                {pages.map((page, index) => {
                    const isPageLocked = !isUnlocked && (index + 1) >= 3;
                    return (
                        <div key={index} className="bg-white rounded-2xl shadow-md overflow-hidden">
                            <div className="aspect-[4/3] relative bg-gray-100">
                                {page.image ? (
                                    <Image src={page.image} alt={`Page ${index + 1}`} fill className={`object-cover ${isPageLocked ? 'blur-lg opacity-50' : ''}`} />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                        <span className="text-4xl animate-pulse">🎨</span>
                                    </div>
                                )}
                                {isPageLocked && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                                        <div className="bg-white/95 p-4 rounded-2xl shadow-xl text-center">
                                            <div className="text-3xl mb-2">🔒</div>
                                            <p className="text-sm font-bold text-gray-800">Débloquez pour voir</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-6">
                                <span className="text-xs font-bold text-gray-400 mb-2 block">Page {index + 1}</span>
                                {isEditable && onTextChange ? (
                                    <textarea
                                        value={page.text}
                                        onChange={(e) => onTextChange(index, e.target.value)}
                                        className="w-full h-32 p-3 bg-orange-50/30 rounded-lg border border-orange-100 text-gray-800 text-base leading-relaxed focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                                    />
                                ) : (
                                    <p className="text-base leading-relaxed text-gray-800">
                                        {renderText(page.text)}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ============ DESKTOP VIEW ============ */}
            <div className="hidden md:flex w-full h-full items-center justify-center relative">

                {/* Toolbar — Top Right */}
                <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
                    {enableAudio && (
                        <button
                            onClick={handlePlayAudio}
                            disabled={audioLoading}
                            className={`h-10 px-4 rounded-full flex items-center gap-2 transition-all shadow-lg text-sm font-medium ${isPlaying
                                ? 'bg-orange-500 text-white ring-2 ring-orange-300 ring-offset-2 ring-offset-[#1a1a2e]'
                                : 'bg-white/90 text-gray-600 hover:bg-white hover:scale-105'
                                }`}
                            title={isPlaying ? "Arrêter" : "Écouter"}
                        >
                            {audioLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                            ) : isPlaying ? (
                                <><span>⏹</span> Arrêter</>
                            ) : (
                                <><span>🔊</span> Écouter</>
                            )}
                        </button>
                    )}

                    {showFullscreen && (
                        <button
                            onClick={toggleFullscreen}
                            className="w-10 h-10 rounded-full bg-white/90 text-gray-600 flex items-center justify-center shadow-lg hover:bg-white hover:scale-105 transition-all"
                            title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                {isFullscreen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                )}
                            </svg>
                        </button>
                    )}
                </div>

                {/* Page Counter */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <div className="bg-white/10 backdrop-blur-md text-white/70 px-4 py-2 rounded-full text-sm font-medium border border-white/10">
                        {currentPage === 0 ? 'Couverture' : `Page ${currentPage}`} / {totalPages}
                    </div>
                </div>

                {/* Navigation Arrows */}
                <button
                    onClick={handlePrev}
                    disabled={currentPage === 0}
                    className="absolute left-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all disabled:opacity-0 disabled:pointer-events-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
                <button
                    onClick={handleNext}
                    disabled={currentPage >= totalPages}
                    className="absolute right-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all disabled:opacity-0 disabled:pointer-events-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </button>

                {/* ===== BOOK CONTENT ===== */}
                <AnimatePresence mode="wait" custom={direction}>
                    {currentPage === 0 ? (
                        /* --- COVER --- */
                        <motion.div
                            key="cover"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.35, ease: 'easeInOut' }}
                            className="w-[55vh] max-w-[600px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 relative"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/30 to-transparent z-20 pointer-events-none"></div>

                            {coverUrl ? (
                                <Image src={coverUrl} alt="Cover" fill className="object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center flex-col text-orange-300 animate-pulse bg-orange-50">
                                    <span className="text-6xl mb-4">✨</span>
                                    <span className="text-lg font-bold">Création...</span>
                                </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/30 p-8 flex flex-col items-center justify-between z-10">
                                <h1 className="text-3xl lg:text-4xl text-white text-center drop-shadow-2xl mt-6 max-w-md leading-tight font-[family-name:var(--font-chewy)] tracking-wide">
                                    {personalize(book.story_content?.title || book.title || "Voyage Magique")}
                                </h1>
                                <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-xl mb-4">
                                    <p className="text-sm text-gray-700 italic font-medium">
                                        Une aventure pour <span className="text-orange-600 font-bold">{book.child_name}</span>
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                    ) : currentPage <= totalPages ? (
                        /* --- CONTENT PAGES (Open Book) --- */
                        <motion.div
                            key={currentPage}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.35, ease: 'easeInOut' }}
                            className="flex w-[85vw] max-w-[1100px] aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 relative"
                        >
                            {/* Left Page — Illustration */}
                            <div className="w-1/2 h-full relative bg-gray-100 overflow-hidden">
                                <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-black/15 to-transparent z-10 pointer-events-none"></div>

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
                                            <div className="absolute inset-0 flex items-center justify-center flex-col text-gray-400 bg-gray-50">
                                                <span className="text-6xl animate-bounce mb-4">🎨</span>
                                                <p className="font-bold">Illustration en cours...</p>
                                            </div>
                                        );
                                    }
                                })()}

                                {(!isUnlocked && currentPage >= 3) && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-20">
                                        <div className="bg-white/95 p-6 rounded-3xl shadow-2xl text-center">
                                            <div className="text-5xl mb-3">🔒</div>
                                            <p className="text-gray-900 font-bold">Débloquez pour voir</p>
                                        </div>
                                    </div>
                                )}

                                {!isUnlocked && (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none z-10">
                                        <span className="text-white font-black text-3xl -rotate-12 uppercase">Kusoma Kids</span>
                                    </div>
                                )}
                            </div>

                            {/* Center Spine */}
                            <div className="w-[2px] bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 relative z-20 flex-shrink-0">
                                <div className="absolute inset-0 shadow-[0_0_8px_rgba(0,0,0,0.15)]"></div>
                            </div>

                            {/* Right Page — Text */}
                            <div className="w-1/2 h-full flex flex-col items-center justify-center bg-[#FFFDF7] relative overflow-hidden">
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' }}>
                                </div>

                                <span className="absolute top-5 right-6 text-orange-300/60 text-xs font-bold tracking-widest uppercase">
                                    {currentPage}
                                </span>

                                <div className="flex-1 w-full flex items-center justify-center p-8 lg:p-14">
                                    {isEditable && onTextChange ? (
                                        <textarea
                                            value={pages[currentPage - 1]?.text}
                                            onChange={(e) => onTextChange(currentPage - 1, e.target.value)}
                                            className="w-full bg-transparent text-xl text-gray-800 leading-relaxed focus:ring-4 focus:ring-orange-100 outline-none resize-none text-center font-serif border-2 border-dashed border-gray-200 rounded-xl p-4 min-h-[250px]"
                                            style={{ fieldSizing: 'content' }}
                                        />
                                    ) : (
                                        <p className="text-lg lg:text-2xl leading-loose font-serif text-center max-w-lg mx-auto text-gray-800">
                                            {renderText(pages[currentPage - 1]?.text)}
                                        </p>
                                    )}
                                </div>

                                <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none">
                                    <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[16px] border-l-transparent border-b-[16px] border-b-gray-200/50"></div>
                                </div>
                            </div>
                        </motion.div>

                    ) : (
                        /* --- END PAGE --- */
                        <motion.div
                            key="end"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="w-[55vh] max-w-[600px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 bg-[#FFFDF7] flex flex-col items-center justify-center p-8 text-center relative"
                        >
                            <div className="text-6xl mb-6 animate-bounce">🎉</div>
                            <h2 className="text-4xl font-chewy text-orange-600 mb-4">Fin !</h2>
                            <p className="text-lg text-gray-600 mb-8 max-w-sm">
                                Bravo ! Tu as terminé cette aventure fantastique avec {book.child_name}.
                            </p>
                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="bg-orange-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg hover:bg-orange-600 hover:scale-105 transition-all"
                            >
                                Retour aux histoires ✨
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
