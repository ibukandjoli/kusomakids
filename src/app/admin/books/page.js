'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminBooksPage() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBooks();
    }, []);

    async function fetchBooks() {
        const { data, error } = await supabase.from('story_templates').select('*').order('created_at', { ascending: false });
        if (!error) setBooks(data);
        setLoading(false);
    }

    // This is a placeholder for the "Create" functionality which would likely need a Modal or a separate page
    // For now, we list existing books.

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Gestion des Histoires</h1>
                    <button className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30">
                        + Nouvelle Histoire
                    </button>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-6 font-bold text-gray-500 text-sm uppercase">Titre</th>
                                <th className="p-6 font-bold text-gray-500 text-sm uppercase">Slug</th>
                                <th className="p-6 font-bold text-gray-500 text-sm uppercase">Age</th>
                                <th className="p-6 font-bold text-gray-500 text-sm uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="p-8 text-center">Chargement...</td></tr>
                            ) : books.map((book) => (
                                <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-6 font-medium text-gray-900">{book.title}</td>
                                    <td className="p-6 text-gray-500">{book.theme_slug}</td>
                                    <td className="p-6 text-gray-500">{book.age_range}</td>
                                    <td className="p-6">
                                        <button className="text-blue-600 hover:underline mr-4">Modifier</button>
                                        <button className="text-red-500 hover:underline">Supprimer</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8">
                    <Link href="/admin" className="text-gray-500 hover:text-gray-900 font-medium">← Retour au tableau de bord</Link>
                </div>
            </div>
        </div>
    );
}
