'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            // Don't alert immediately, might be RLS issue which is expected before script run
        } finally {
            setLoading(false);
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
                        <h1 className="text-3xl font-bold text-gray-900">Utilisateurs ({users.length})</h1>
                    </div>
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
                                        <th className="text-left py-4 px-6 text-gray-500 font-bold uppercase text-xs">Utilisateur</th>
                                        <th className="text-left py-4 px-6 text-gray-500 font-bold uppercase text-xs">Email</th>
                                        <th className="text-left py-4 px-6 text-gray-500 font-bold uppercase text-xs">Rôle</th>
                                        <th className="text-left py-4 px-6 text-gray-500 font-bold uppercase text-xs">Crédits</th>
                                        <th className="text-left py-4 px-6 text-gray-500 font-bold uppercase text-xs">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-gray-900">
                                                {user.full_name || 'Sans Nom'}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-600">
                                                {user.email}
                                            </td>
                                            <td className="py-4 px-6">
                                                <select
                                                    value={user.role || 'user'}
                                                    onChange={async (e) => {
                                                        const newRole = e.target.value;
                                                        // Optimistic Update
                                                        const originalRole = user.role;
                                                        setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));

                                                        try {
                                                            const res = await fetch('/api/admin/users/update-role', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ userId: user.id, newRole })
                                                            });
                                                            if (!res.ok) throw new Error('Failed to update');
                                                        } catch (err) {
                                                            alert("Erreur lors de la mise à jour du rôle");
                                                            // Revert
                                                            setUsers(users.map(u => u.id === user.id ? { ...u, role: originalRole } : u));
                                                        }
                                                    }}
                                                    className={`px-2 py-1 rounded text-xs font-bold border-0 cursor-pointer focus:ring-2 focus:ring-orange-500 ${(user.role === 'admin' || user.role === 'viewer') ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                                                        }`}
                                                >
                                                    <option value="user">User</option>
                                                    <option value="viewer">Viewer</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td className="py-4 px-6 font-mono text-sm">
                                                {user.credits}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-400">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="py-12 text-center text-gray-500">
                                                Aucun utilisateur trouvé (ou accès restreint).
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
