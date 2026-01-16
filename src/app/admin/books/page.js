'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import Image from 'next/image';

export default function AdminBooksPage() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('story_templates')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBooks(data || []);
        } catch (error) {
            console.error('Error fetching books:', error);
            alert('Erreur lors du chargement des livres');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce livre ? Cette action est irréversible.')) return;

        try {
            const { error } = await supabase
                .from('story_templates')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchBooks(); // Refresh list
        } catch (error) {
            console.error('Error deleting book:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const toggleStatus = async (book) => {
        try {
            const { error } = await supabase
                .from('story_templates')
                .update({ is_active: !book.is_active })
                .eq('id', book.id);

            if (error) throw error;
            fetchBooks();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Erreur lors de la mise à jour');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <Link href="/admin" className="text-gray-500 hover:text-orange-600 mb-2 inline-block">
                            ← Retour au Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Gestion des Livres</h1>
                    </div>
                    <Link href="/admin/books/new" className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200">
                        + Nouveau Livre
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-gray-500 font-bold uppercase text-xs">Aperçu</th>
                                        <th className="text-left py-4 px-6 text-gray-500 font-bold uppercase text-xs">Titre / Slug</th>
                                        <th className="text-left py-4 px-6 text-gray-500 font-bold uppercase text-xs">Status</th>
                                        <th className="text-right py-4 px-6 text-gray-500 font-bold uppercase text-xs">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {books.map((book) => (
                                        <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6 w-24">
                                                <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden relative">
                                                    {book.cover_image_url ? (
                                                        <Image src={book.cover_image_url} alt={book.title_template} fill className="object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-xs text-gray-400">No Img</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-gray-900">{book.title_template}</div>
                                                <div className="text-sm text-gray-500 font-mono">{book.theme_slug}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <button
                                                    onClick={() => toggleStatus(book)}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold ${book.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                                >
                                                    {book.is_active ? 'Actif' : 'Inactif'}
                                                </button>
                                            </td>
                                            <td className="py-4 px-6 text-right space-x-2">
                                                <Link
                                                    href={`/admin/books/${book.id}`}
                                                    className="text-indigo-600 hover:text-indigo-800 font-bold text-sm"
                                                >
                                                    Éditer
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(book.id)}
                                                    className="text-red-500 hover:text-red-700 font-bold text-sm"
                                                >
                                                    Supprimer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {books.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="py-12 text-center text-gray-500">
                                                Aucun livre trouvé. Commencez par en ajouter un !
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
