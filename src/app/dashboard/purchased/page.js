'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import DashboardBottomNav from '../../components/DashboardBottomNav';

function MyPdfsContent() {
    const [user, setUser] = useState(null);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    const router = useRouter();

    useEffect(() => {
        async function fetchPdfs() {
            try {
                // 1. Get User
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error || !session) {
                    router.push('/login');
                    return;
                }
                setUser(session.user);

                // 2. Get Unlocked Books Only
                const { data: booksData } = await supabase
                    .from('generated_books')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .eq('pdf_unlocked', true) // Only ACTUALLY unlocked PDFs
                    .order('created_at', { ascending: false });

                setBooks(booksData || []);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchPdfs();
    }, [router]);

    const handleDownload = async (bookId) => {
        try {
            // Get or create download token
            const response = await fetch(`/api/download-secure/${bookId}/get-token`, {
                method: 'POST'
            });

            if (!response.ok) {
                alert('Erreur lors de la génération du lien de téléchargement');
                return;
            }

            const { token } = await response.json();
            window.open(`/api/download-secure/${bookId}?token=${token}`, '_blank');
        } catch (error) {
            console.error('Download error:', error);
            alert('Erreur lors du téléchargement');
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-50 pt-32 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20 relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'url(/images/pattern_bg.png)', backgroundSize: '400px' }}></div>

            <div className="container mx-auto px-4 relative z-10">

                <div className="mb-10 mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-3xl font-black text-gray-900 border-l-8 border-orange-500 pl-4 py-1">
                        Mes PDFs (Achetés / Débloqués)
                    </h1>
                    <Link href="/dashboard" className="text-orange-600 font-bold hover:underline">
                        ← Retour à la bibliothèque
                    </Link>
                </div>

                {books.length === 0 ? (
                    <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] shadow-xl border border-white/50 p-12 text-center max-w-4xl mx-auto mt-10">
                        <div className="text-6xl mb-6">📂</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Aucun PDF acquis</h2>
                        <p className="text-gray-500 max-w-lg mx-auto mb-8">
                            Vous n'avez pas encore acheté ou débloqué d'histoires avec vos crédits.<br />
                            Les histoires simplement lues en streaming n'apparaissent pas ici.
                        </p>
                        <Link href="/books" className="inline-block bg-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-700 transition-all shadow-lg">
                            Créer une nouvelle histoire
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                        {books.map((book) => (
                            <div key={book.id} className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                                {/* Small Header Image */}
                                <div className="h-32 bg-orange-50 relative overflow-hidden">
                                    {book.cover_image_url || book.cover_url || (book.story_content?.pages?.[0]?.image) ? (
                                        <Image
                                            src={book.cover_image_url || book.cover_url || book.story_content?.pages?.[0]?.image}
                                            alt={book.title || 'Couverture du livre'}
                                            fill
                                            className="object-cover opacity-80"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-orange-200">
                                            <span className="text-4xl">📄</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                                </div>

                                <div className="p-6 flex flex-col flex-grow -mt-8 relative z-10">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center text-3xl mb-4 self-start border border-gray-100">
                                        📄
                                    </div>

                                    <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2">
                                        {(book.story_content?.title || book.title || book.title_template || 'l\'Aventure Magique').replace(/\{childName\}|\[Son prénom\]/gi, book.child_name || '')}
                                    </h3>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-6">
                                        Acquis le {new Date(book.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>

                                    <div className="mt-auto">
                                        <button
                                            onClick={() => handleDownload(book.id)}
                                            className="w-full py-4 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-lg hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span>📥</span> Télécharger le PDF
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <DashboardBottomNav />
        </div>
    );
}

export default function MyPdfsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen pt-32 text-center">Chargement...</div>}>
            <MyPdfsContent />
        </Suspense>
    );
}
