'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BookReader from '@/app/components/BookReader';
import PaymentModal from '@/app/components/PaymentModal';

export default function ReadPage() {
    const { id } = useParams();
    const router = useRouter();
    const [book, setBook] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    // Polling Logic for Pending Images
    useEffect(() => {
        if (!book) return;

        const content = book.story_content || {};
        const pages = Array.isArray(content.pages) ? content.pages : [];
        const hasPendingImages = pages.some(p => !p.image && !p.image_url);

        if (hasPendingImages) {
            const interval = setInterval(async () => {
                const { data: updatedBook } = await supabase
                    .from('generated_books')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (updatedBook) {
                    setBook(updatedBook);
                }
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [book, id]);

    // Initial Load
    useEffect(() => {
        async function init() {
            const { data: { user: authUser } } = await supabase.auth.getUser();

            let profile = null;
            if (authUser) {
                const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
                profile = data;
                setUser(profile);
            }

            if (id) {
                const { data: bookData, error } = await supabase
                    .from('generated_books')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (!error && bookData) {
                    setBook(bookData);
                } else {
                    console.error("Book not found", error);
                }
            }
            setLoading(false);
        }

        init();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
                <p className="text-white/60 text-sm">Chargement de votre histoire...</p>
            </div>
        </div>
    );

    if (!book) return (
        <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center text-white">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Histoire introuvable 😢</h1>
                <button onClick={() => router.push('/dashboard')} className="text-orange-400 hover:underline">Retour au tableau de bord</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center p-0 relative">
            {/* Top Bar — Clean & Minimal */}
            <div className="absolute top-0 left-0 w-full p-5 flex justify-between items-center z-10">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="text-white/50 hover:text-white flex items-center gap-2 transition-colors text-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Retour
                </button>

                <div className="flex items-center gap-2">
                    {/* Unlock Button */}
                    {!book.is_unlocked && user?.subscription_status !== 'active' && (
                        <button
                            onClick={() => setIsPaymentOpen(true)}
                            className="bg-orange-600 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-orange-500 transition-colors shadow-lg shadow-orange-500/20"
                        >
                            🔓 Débloquer
                        </button>
                    )}

                    {/* Share Button */}
                    <button
                        onClick={() => {
                            const shareUrl = `${window.location.origin}/share/${book.id}`;
                            navigator.clipboard.writeText(shareUrl).then(() => {
                                const notification = document.createElement('div');
                                notification.className = 'fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-bold';
                                notification.innerHTML = '🔗 Lien copié !';
                                document.body.appendChild(notification);
                                setTimeout(() => notification.remove(), 2500);
                            });
                        }}
                        className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all"
                        title="Partager"
                    >
                        <span className="text-sm">🔗</span>
                    </button>
                </div>
            </div>

            <BookReader
                book={book}
                user={user}
                onUnlock={() => setIsPaymentOpen(true)}
            />

            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                user={user || {}}
                bookId={book.id}
                book={book}
                profile={user}
            />
        </div>
    );
}
