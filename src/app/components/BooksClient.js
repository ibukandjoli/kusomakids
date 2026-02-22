'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { formatTitle } from '@/utils/format';

export default function BooksClient() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterGender, setFilterGender] = useState('all');
    const [childName, setChildName] = useState(null);
    const [childGender, setChildGender] = useState(null); // 'boy' | 'girl' | null

    useEffect(() => {
        async function fetchData() {
            try {
                // 1. Fetch User & Children (for personalization + gender)
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const { data: children } = await supabase
                        .from('children')
                        .select('first_name, gender')
                        .eq('user_id', session.user.id)
                        .limit(1);

                    if (children && children.length > 0) {
                        setChildName(children[0].first_name);
                        const g = children[0].gender?.toLowerCase();
                        if (g === 'girl' || g === 'fille' || g === 'f') {
                            setChildGender('girl');
                            setFilterGender('girl'); // Auto-select
                        } else if (g === 'boy' || g === 'garçon' || g === 'garcon' || g === 'm') {
                            setChildGender('boy');
                            setFilterGender('boy'); // Auto-select
                        }
                    }
                }

                // 2. Fetch Books ONCE
                let query = supabase.from('story_templates').select('*').eq('is_active', true);
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
    }, []);

    // Helper to personalize text based on gender context
    const personalize = (text, bookGender) => {
        if (!text) return '';

        let name;
        if (childName && childGender && bookGender) {
            // Logged in: use child name only if gender matches
            if (childGender === bookGender || bookGender === 'unisex') {
                name = childName;
            } else {
                // Gender mismatch: use generic gendered label
                name = bookGender === 'girl' ? 'Votre fille' : 'Votre garçon';
            }
        } else if (childName && !bookGender) {
            // No genre set on book: use child name
            name = childName;
        } else {
            // Not logged in: use gendered fallback based on filter or book genre
            const g = bookGender || filterGender;
            if (g === 'girl') name = 'Votre fille';
            else if (g === 'boy') name = 'Votre garçon';
            else name = 'Votre Enfant';
        }

        return formatTitle(text)
            .replace(/\[Son prénom\]/gi, name)
            .replace(/\{childName\}/gi, name);
    };

    // Clientside filtering by gender
    const filteredBooks = books.filter(book => {
        if (filterGender === 'all') return true;
        const bookGender = book.genre?.toLowerCase();
        if (!bookGender || bookGender === 'unisex') return true; // unisex shows in all
        return bookGender === filterGender;
    });

    // Dynamic subtitle
    const getSubtitle = () => {
        if (childName && childGender) {
            if (filterGender === 'all' || filterGender === childGender) {
                return <>Des histoires uniques où <span className="text-orange-600 font-bold">{childName}</span> devient {childGender === 'girl' ? "l'héroïne" : 'le héros'}.</>;
            } else {
                const label = filterGender === 'girl' ? 'votre fille' : 'votre garçon';
                return <>Des histoires uniques où <span className="text-orange-600 font-bold">{label}</span> devient {filterGender === 'girl' ? "l'héroïne" : 'le héros'}.</>;
            }
        }
        if (filterGender === 'girl') return <>Des histoires uniques où <span className="text-orange-600 font-bold">votre fille</span> devient l&apos;héroïne.</>;
        if (filterGender === 'boy') return <>Des histoires uniques où <span className="text-orange-600 font-bold">votre garçon</span> devient le héros.</>;
        return <>Des histoires uniques où <span className="text-orange-600 font-bold">{childName || 'votre enfant'}</span> devient le héros.</>;
    };

    return (
        <div className="min-h-screen pt-32 pb-20 relative bg-[#FAFAF8]">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'url(/images/pattern_bg.png)', backgroundSize: '400px' }}></div>

            <div className="container mx-auto px-4 relative z-10">

                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">Notre Bibliothèque Magique</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        {getSubtitle()}
                    </p>
                </div>

                {/* Gender Filters */}
                <div className="flex justify-center gap-4 mb-12 flex-wrap">
                    {[
                        { key: 'all', label: 'Toutes les histoires' },
                        { key: 'girl', label: 'Pour les filles 👧🏾' },
                        { key: 'boy', label: 'Pour les garçons 👦🏾' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilterGender(key)}
                            className={`px-6 py-2 rounded-full font-bold transition-all ${filterGender === key
                                ? 'bg-orange-500 text-white shadow-lg scale-105'
                                : 'bg-white text-gray-600 hover:bg-orange-50'
                                }`}
                        >
                            {label}
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
                                            {(book.cover_image_url || book.cover_url) ? (
                                                <Image
                                                    src={book.cover_image_url || book.cover_url}
                                                    alt={book.title}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-gray-300 font-bold text-lg">
                                                    Pas d&apos;image
                                                </div>
                                            )}

                                            {/* Gender + Age Badge */}
                                            <div className="absolute top-4 right-4 flex flex-col gap-2">
                                                {book.age_range && (
                                                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-orange-600 shadow-sm">
                                                        {book.age_range.replace(/\s*ans$/i, '')} ans
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 flex flex-col flex-grow">
                                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                                                {personalize(book.title, book.genre)}
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
                                <p className="text-xl text-gray-500">Aucune histoire trouvée pour ce filtre.</p>
                                <button
                                    onClick={() => setFilterGender('all')}
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
