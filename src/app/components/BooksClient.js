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
    const [childName, setChildName] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // 1. Fetch User & Children (for personalization)
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const { data: children } = await supabase
                        .from('children')
                        .select('first_name')
                        .eq('user_id', session.user.id)
                        .limit(1);

                    if (children && children.length > 0) {
                        setChildName(children[0].first_name);
                    }
                }

                // 2. Fetch Books ONCE
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

        fetchData();
    }, []); // Empty dependency array: Fetch only once on mount

    // Helper to personalize text
    const personalize = (text) => {
        if (!text) return '';
        const name = childName || 'Votre Enfant'; // Fallback if not logged in
        return formatTitle(text)
            .replace(/\[Son prénom\]/gi, name)
            .replace(/\{childName\}/gi, name);
    };

    // Clientside filtering with Range Overlap
    const filteredBooks = books.filter(book => {
        if (filterAge === 'all') return true;

        // Parse Filter Range
        let fMin = 0, fMax = 100;
        if (filterAge.includes('+')) {
            fMin = parseInt(filterAge);
        } else if (filterAge.includes('-')) {
            [fMin, fMax] = filterAge.split('-').map(Number);
        }

        // Parse Book Range (e.g. "3-6 ans", "4-8")
        // If string format is loose, we extract first and second numbers.
        const matches = book.age_range ? String(book.age_range).match(/(\d+)/g) : null;
        if (!matches) return true; // Show if no age defined

        const bMin = parseInt(matches[0]);
        const bMax = matches[1] ? parseInt(matches[1]) : bMin; // Handle single age "4 ans"

        // Check if ranges overlap
        // Overlap condition: max(start1, start2) <= min(end1, end2)
        return Math.max(fMin, bMin) <= Math.min(fMax, bMax);
    });

    return (
        <div className="min-h-screen pt-32 pb-20 relative bg-[#FAFAF8]">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'url(/images/pattern_bg.png)', backgroundSize: '400px' }}></div>

            <div className="container mx-auto px-4 relative z-10">

                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">Notre Bibliothèque Magique</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Des histoires uniques où <span className="text-orange-600 font-bold">{childName || 'votre enfant'}</span> devient le héros.
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                        {filteredBooks.length > 0 ? (
                            filteredBooks.map((book) => (
                                <Link href={`/book/${book.theme_slug || book.id}`} key={book.id} className="group">
                                    <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col border border-gray-100">
                                        {/* Image Container */}
                                        <div className="relative aspect-square overflow-hidden bg-gray-100">
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
                                            {book.age_range && (
                                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-orange-600 shadow-sm">
                                                    {book.age_range.replace(/\s*ans$/i, '')} ans
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 flex flex-col flex-grow">
                                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                                                {personalize(book.title)}
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
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20">
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
                )}
            </div>
        </div>
    );
}
