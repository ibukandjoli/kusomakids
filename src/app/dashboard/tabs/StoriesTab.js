'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function StoriesTab({ books, profile, onPaymentRequired }) {

    // Helper to check access
    const canAccessBook = (book) => {
        if (profile?.subscription_status === 'active') return true;
        if (book.is_unlocked) return true;
        return false;
    };

    const handleAction = (book, action) => {
        if (canAccessBook(book)) {
            // Authorized
            if (action === 'read') window.location.href = `/read/${book.id}`; // using window.location for full refresh/router is fine
            if (action === 'download') window.open(`/api/download/${book.id}`, '_blank');
        } else {
            // Unauthorized
            onPaymentRequired(book);
        }
    };

    if (books.length === 0) {
        return (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center animate-in fade-in zoom-in duration-500">
                <div className="text-6xl mb-6">📚</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Votre bibliothèque est vide</h2>
                <p className="text-gray-500 max-w-md mx-auto mb-8">
                    C'est calme ici... Trop calme ! Créez votre première aventure magique.
                </p>
                <Link href="/books" className="inline-block bg-orange-500 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30">
                    Découvrir le catalogue →
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            {books.map((book) => {
                const locked = !canAccessBook(book);
                return (
                    <div key={book.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all group">
                        {/* Cover Helper */}
                        <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                            {/* Placeholder Cover */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 bg-orange-50">
                                <span className="text-5xl mb-2">📖</span>
                                <span className="text-xs font-bold uppercase tracking-widest text-orange-200">Kusoma Kids</span>
                            </div>

                            {/* Lock Overlay */}
                            {locked && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-10 transition-opacity">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md mb-2">
                                        🔒
                                    </div>
                                    <span className="font-bold text-sm">Contenu Verrouillé</span>
                                </div>
                            )}
                        </div>

                        <div className="p-6">
                            <h3 className="font-bold text-xl text-gray-900 mb-1 line-clamp-1" title={book.title_template ? `${book.child_name} et ${book.title_template}` : `L'aventure de ${book.child_name}`}>
                                {book.child_name} {book.title_template ? `& ${book.title_template}` : 'en aventure'}
                            </h3>
                            <p className="text-gray-500 text-sm mb-6">Créé le {new Date(book.created_at).toLocaleDateString()}</p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleAction(book, 'read')}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold border-2 transition-colors flex items-center justify-center gap-2 ${!locked
                                            ? 'border-orange-500 text-orange-600 hover:bg-orange-50'
                                            : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                        }`}
                                >
                                    <span>Lire</span> {locked && '🔒'}
                                </button>
                                <button
                                    onClick={() => handleAction(book, 'download')}
                                    className={`py-3 px-4 rounded-xl font-bold border-2 border-transparent transition-colors ${!locked
                                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                        }`}
                                    title="Télécharger PDF"
                                >
                                    📥
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Add Card */}
            <Link href="/books" className="group border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center p-6 text-gray-400 hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50 transition-all min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-orange-100 flex items-center justify-center text-2xl transition-colors mb-4">
                    +
                </div>
                <span className="font-bold">Créer une nouvelle histoire</span>
            </Link>
        </div>
    );
}
