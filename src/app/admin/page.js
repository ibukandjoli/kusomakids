'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        users: 0,
        booksCreated: 0,
        booksPurchased: 0,
        revenue: '0 F',
        clubMembers: 0,
        visitors: 0,
        visitsByDay: {}
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch('/api/admin/stats');
                if (!response.ok) throw new Error('Failed to fetch stats');
                const data = await response.json();

                // Calculate Revenue (Approximation: 3000 FCFA per book)
                const revenue = (data.booksPurchased || 0) * 3000;
                const formattedRevenue = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(revenue);

                setStats({
                    users: data.users || 0,
                    booksCreated: data.booksCreated || 0,
                    booksPurchased: data.booksPurchased || 0,
                    revenue: formattedRevenue,
                    clubMembers: data.clubMembers || 0,
                    recentBooks: data.recentBooks || [],
                    topTemplates: data.topTemplates || []
                });

            } catch (error) {
                console.error("Admin stats error:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-32 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Tableau de bord Admin</h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-bold uppercase">Utilisateurs</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.users}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-bold uppercase">Histoires Créées</h3>
                        <p className="text-3xl font-bold text-orange-600 mt-2">{stats.booksCreated}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-bold uppercase">Revenu (Est.)</h3>
                        <p className="text-3xl font-bold text-green-600 mt-2 text-nowrap">{stats.revenue}</p>
                        <p className="text-xs text-gray-400 mt-1">{stats.booksPurchased} ventes</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-bold uppercase">Membres Club</h3>
                        <p className="text-3xl font-bold text-purple-600 mt-2">{stats.clubMembers}</p>
                    </div>
                </div>

                {/* Advanced Stats & Activity Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

                    {/* Recent Activity Table (Span 2) */}
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">Activité Récente</h2>
                            <Link href="/admin/books" className="text-sm text-orange-600 font-bold hover:underline">Tout voir</Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <tbody className="divide-y divide-gray-50">
                                    {(stats.recentBooks || []).map((book) => (
                                        <tr key={book.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-12 bg-gray-100 rounded overflow-hidden relative">
                                                        {book.cover_image_url ? (
                                                            <img src={book.cover_image_url} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs">📖</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">{book.title || 'Sans titre'}</p>
                                                        <p className="text-xs text-gray-500">{new Date(book.created_at).toLocaleDateString()} • {new Date(book.created_at).toLocaleTimeString().slice(0, 5)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm">
                                                    <p className="font-medium text-gray-900">{book.user_name}</p>
                                                    <p className="text-xs text-gray-400">{book.user_email}</p>
                                                </div>
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                {book.is_unlocked ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Acheté
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        Brouillon
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!stats.recentBooks || stats.recentBooks.length === 0) && (
                                        <tr><td colSpan="3" className="p-8 text-center text-gray-400">Aucune activité récente</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Insights Column */}
                    <div className="space-y-6">
                        {/* Conversion Rate */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-gray-500 text-sm font-bold uppercase mb-4">Taux de Conversion</h3>
                            <div className="flex items-end gap-3">
                                <p className="text-4xl font-black text-gray-900">
                                    {stats.booksCreated > 0
                                        ? ((stats.booksPurchased / stats.booksCreated) * 100).toFixed(1)
                                        : 0}%
                                </p>
                                <p className="text-sm text-gray-400 mb-1.5">des histoires sont achetées</p>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
                                <div
                                    className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                                    style={{ width: `${stats.booksCreated > 0 ? (stats.booksPurchased / stats.booksCreated) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Top Templates */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-gray-500 text-sm font-bold uppercase mb-4">Thèmes Populaires</h3>
                            <div className="space-y-4">
                                {(stats.topTemplates || []).map((tmpl, idx) => (
                                    <div key={tmpl.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 flex items-center justify-center bg-orange-100 text-orange-600 font-bold text-xs rounded-full">
                                                {idx + 1}
                                            </span>
                                            <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]" title={tmpl.id}>
                                                {tmpl.id === 'Autre' ? 'Inconnu' : tmpl.id.slice(0, 20)}...
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">{tmpl.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Actions */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Gestion du Catalogue</h2>
                        <p className="text-gray-600 mb-6">Ajouter, modifier ou supprimer des histoires de la bibliothèque.</p>
                        <Link href="/admin/books" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors">
                            Gérer les histoires
                        </Link>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Utilisateurs</h2>
                        <p className="text-gray-600 mb-6">Voir la liste des utilisateurs et leurs commandes récentes.</p>
                        <Link href="/admin/users" className="inline-block bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:border-gray-900 hover:text-gray-900 transition-colors">
                            Voir les utilisateurs
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
