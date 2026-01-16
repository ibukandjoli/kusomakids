'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        users: 0,
        booksCreated: 0,
        booksPurchased: 0,
        revenue: '0 F',
        clubMembers: 0
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchStats() {
            try {
                // 1. Users Count
                const { count: userCount, error: userError } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });

                // 2. Books Created (Total)
                const { count: booksCount, error: booksError } = await supabase
                    .from('generated_books')
                    .select('*', { count: 'exact', head: true });

                // 3. Books Purchased (Unlocked) - Approximation of Revenue
                const { count: purchasedCount, error: purchasedError } = await supabase
                    .from('generated_books')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_unlocked', true);

                // 4. Club Members (Active subscription)
                const { count: clubCount, error: clubError } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('subscription_status', 'active'); // Assuming 'active' means paid member

                if (userError || booksError || purchasedError || clubError) {
                    console.error("Error fetching stats", { userError, booksError, purchasedError, clubError });
                }

                // Calculate Revenue (Approximation: 3000 FCFA per book)
                // Note: This is naive. Ideally we used a 'orders' table.
                const revenue = (purchasedCount || 0) * 3000;
                const formattedRevenue = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(revenue);

                setStats({
                    users: userCount || 0,
                    booksCreated: booksCount || 0,
                    booksPurchased: purchasedCount || 0,
                    revenue: formattedRevenue,
                    clubMembers: clubCount || 0
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

                {/* Actions */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Gestion du Catalogue</h2>
                        <p className="text-gray-600 mb-6">Ajouter, modifier ou supprimer des histoires de la bibliothèque.</p>
                        <Link href="/admin/books" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors">
                            Gérer les livres
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
