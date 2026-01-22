'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminAnalyticsDashboard() {
    const [stats, setStats] = useState({
        users: 357,
        booksCreated: 122,
        booksPurchased: 138, // Derived approx for consistency or just mocked
        revenue: '414 000 FCFA',
        clubMembers: 19,
        visitors: 1240, // Mocked extra
        visitsByDay: {},
        recentBooks: [
            {
                id: 'mock-1',
                title: 'Le Secret de la Forêt',
                cover_image_url: null,
                created_at: new Date().toISOString(),
                user_name: 'Parent Test',
                user_email: 'test@example.com',
                is_unlocked: true
            },
            {
                id: 'mock-2',
                title: 'L\'aventure Spatiale',
                cover_image_url: null,
                created_at: new Date(Date.now() - 86400000).toISOString(),
                user_name: 'Autre Parent',
                user_email: 'autre@example.com',
                is_unlocked: false
            }
        ],
        topTemplates: [
            { id: 'Magic', count: 45 },
            { id: 'Space', count: 32 },
            { id: 'Animals', count: 28 }
        ]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading delay for realism, then stop loading
        const timer = setTimeout(() => {
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
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
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin" className="text-gray-400 hover:text-gray-600">
                        ← Retour
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics (Mock)</h1>
                </div>

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
                        <p className="text-xs text-gray-400 mt-1">{stats.booksPurchased} transactions</p>
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
                            <h2 className="text-lg font-bold text-gray-900">Activité Récente (Mock)</h2>
                            <span className="text-sm text-gray-400">Données fictives</span>
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
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Insights Column */}
                    <div className="space-y-6">
                        {/* Conversion Rate */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-gray-500 text-sm font-bold uppercase mb-4">Taux de Conversion (Simulé)</h3>
                            <div className="flex items-end gap-3">
                                {/* Can calculate a mock rate, e.g. based on our mock numbers: 138/122 > 100% which is funny. 
                                    Let's just mock the display to look reasonable. 
                                    Say 15% conversion rate for realism? Or use the numbers? 
                                    Let's use the number I put (138 purchased) which is higher than Created (122).
                                    Maybe I should lower purchased count for logic?
                                    Actually, "Stories created" might be 122 NEW ones, but purchases include backlog?
                                    Let's just show a static high number or "N/A" if it looks broken.
                                    I'll just put a hardcoded "12%" for the mock aesthetic.
                                */}
                                <p className="text-4xl font-black text-gray-900">
                                    34.2%
                                </p>
                                <p className="text-sm text-gray-400 mb-1.5">des histoires sont achetées</p>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
                                <div
                                    className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                                    style={{ width: '34.2%' }}
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
                                                {tmpl.id}
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">{tmpl.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
