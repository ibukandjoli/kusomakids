'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function PurchasedBooksPage() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchPurchasedBooks() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/login');
                    return;
                }

                // Fetch only UNLOCKED books for this user
                const { data, error } = await supabase
                    .from('generated_books')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .eq('is_unlocked', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setBooks(data || []);

            } catch (err) {
                console.error("Error fetching purchased books:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchPurchasedBooks();
    }, [router]);

    if (loading) return <div className="min-h-screen pt-40 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div></div>;

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20 relative">
            <div className="container mx-auto px-4">
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-gray-900 border-l-8 border-orange-500 pl-4 py-1">
                        Mes PDFs achetés
                    </h1>
                    <p className="text-gray-600 mt-2 pl-6">
                        Retrouvez ici toutes les histoires que vous avez débloquées.
                    </p>
                </div>

                {books.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-gray-100 max-w-2xl mx-auto">
                        <span className="text-6xl mb-4 block">📂</span>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun livre acheté</h2>
                        <p className="text-gray-500 mb-6">Vous n'avez pas encore acheté ou débloqué d'histoire en PDF.</p>
                        <Link href="/dashboard" className="inline-block bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors">
                            Retourner à mes histoires
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {books.map((book) => (
                            <div key={book.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                                <div className="p-6 flex items-start gap-4">
                                    <div className="w-20 h-24 bg-gray-100 rounded-lg relative overflow-hidden flex-shrink-0">
                                        {book.cover_url ? (
                                            <Image src={book.cover_url} alt={book.title} fill className="object-cover" />
                                        ) : (
                                            <span className="flex items-center justify-center h-full text-2xl">📕</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 line-clamp-2 mb-1">{book.title || 'Livre Sans Titre'}</h3>
                                        <p className="text-xs text-gray-400 capitalize mb-3">
                                            {new Date(book.created_at).toLocaleDateString('fr-FR')} • {book.child_name}
                                        </p>
                                        <a
                                            href={`/api/download/${book.id}`}
                                            target="_blank"
                                            className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700 hover:underline"
                                        >
                                            ⬇️ Télécharger PDF
                                        </a>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">ACHETÉ</span>
                                    <Link href={`/read/${book.id}`} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                                        Lire en ligne →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
