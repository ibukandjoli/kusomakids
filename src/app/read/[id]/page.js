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
                    .from('generated_books') // Assuming this is the table for USER books
                    .select('*')
                    .eq('id', id)
                    .single();

                if (!error && bookData) {
                    setBook(bookData);
                } else {
                    // Fallback: Check if it's a template? Or redirect
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
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative">
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
                user={user || {}} // Handle guest if needed? Assuming logged in for now based on dashboard flow
                bookId={book.id}
                bookCover={book.cover_image_url || book.cover_url} // Pass cover to modal
            />
        </div>
    );
}
