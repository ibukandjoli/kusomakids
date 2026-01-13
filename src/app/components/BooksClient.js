'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { formatTitle } from '@/utils/format';

export default function BooksClient() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterAge, setFilterAge] = useState('all');

    useEffect(() => {
        async function fetchBooks() {
            try {
                let query = supabase.from('story_templates').select('*');

                const { data, error } = await query;

                if (error) {
                    console.error('Error fetching templates:', error);
                } else {
                    setBooks(data || []);
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchBooks();
    }, [filterAge]);

    // Clientside filtering
    const filteredBooks = filterAge === 'all'
        ? books
        : books.filter(book => book.age_range.includes(filterAge.split('-')[0]));

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="container mx-auto px-4">

                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">Notre Bibliothèque Magique</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Des histoires uniques où votre enfant devient le héros. Choisissez une histoire et personnalisez-la avec le prénom et la photo de votre enfant.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex justify-center gap-4 mb-12 flex-wrap">
                    {['all', '2-4', '4-6', '6+'].map((age) => (
                        <button
                            key={age}
                            onClick={() => setFilterAge(age)}
                            className={`px-6 py-2 rounded-full font-bold transition-all ${filterAge === age
                                ? 'bg-orange-500 text-white shadow-lg scale-105'
                                : 'bg-white text-gray-600 hover:bg-orange-50'
                                }`}
                        >
                            {age === 'all' ? 'Tous les âges' : `${age} ans`}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                        {filteredBooks.map((book) => (
                            <Link href={`/book/${book.id}`} key={book.id} className="group">
                                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col">
                                    {/* Image Container */}
                                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                                        {book.cover_url ? (
                                            <Image
                                                src={book.cover_url}
                                                alt={book.title}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-gray-300 font-bold text-lg">
                                                Pas d'image
                                            </div>
                                        )}

                                        {/* Badge */}
                                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-orange-600 shadow-sm">
                                            {book.age_range} ans
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex flex-col flex-grow">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                                            {formatTitle(book.title)}
                                        </h3>
                                        <p className="text-gray-500 text-sm italic mb-4 flex-grow">
                                            {book.tagline || book.description}
                                        </p>
                                        <div className="flex justify-between items-center mt-auto">
                                            <span className="text-orange-500 font-bold group-hover:translate-x-1 transition-transform">
                                                Découvrir →
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {!loading && filteredBooks.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-xl text-gray-500">Aucune histoire trouvée pour cette tranche d'âge.</p>
                        <button
                            onClick={() => setFilterAge('all')}
                            className="mt-4 text-orange-600 font-bold hover:underline"
                        >
                            Voir toutes les histoires
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
