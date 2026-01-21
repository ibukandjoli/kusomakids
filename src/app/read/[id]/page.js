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
                console.log("🔄 Checking for new illustrations...");
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
            // 1. Get User
            const { data: { user: authUser } } = await supabase.auth.getUser();

            let profile = null;
            if (authUser) {
                const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
                profile = data;
                setUser(profile);
            }

            // 2. Get Book
            if (id) {
                const { data: bookData, error } = await supabase
                    .from('generated_books')
                    .select('*')
                    .eq('id', id)
                    .single(); // Ensure we get fresh data

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
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
            <div className="animate-pulse">Chargement de votre histoire...</div>
        </div>
    );

    if (!book) return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Histoire introuvable 😢</h1>
                <button onClick={() => router.push('/dashboard')} className="text-orange-400 hover:underline">Retour au tableau de bord</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-0 relative">
            {/* Top Bar */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
                <button onClick={() => router.push('/dashboard')} className="text-white/60 hover:text-white flex items-center gap-2 transition-colors">
                    ← Retour
                </button>
                {!book.is_unlocked && user?.subscription_status !== 'active' && (
                    <button
                        onClick={() => setIsPaymentOpen(true)}
                        className="bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-orange-500 transition-colors shadow-lg shadow-orange-500/20"
                    >
                        Débloquer l'histoire
                    </button>
                )}
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
                bookCover={book.cover_image_url || book.cover_url}
            />

            {/* Manual Refresh Button - Debugging Aid */}
            <button
                onClick={async () => {
                    console.log("🔄 Manual refresh...");
                    const { data: updatedBook } = await supabase
                        .from('generated_books')
                        .select('*')
                        .eq('id', id)
                        .single();
                    if (updatedBook) {
                        setBook(updatedBook);
                        alert("Images rafraîchies !");
                    }
                }}
                className="fixed bottom-4 right-4 bg-white shadow-lg p-3 rounded-full z-50 hover:bg-gray-50 transition-colors border-2 border-orange-100"
                title="Rafraîchir les images"
            >
                <span className="text-2xl">🔄</span>
            </button>
        </div>
    );
}
