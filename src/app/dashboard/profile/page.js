'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '', // Read only
        avatar_url: ''
    });
    const [message, setMessage] = useState(null);
    const router = useRouter();

    useEffect(() => {
        async function fetchProfile() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/login');
                    return;
                }
                setUser(session.user);

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    setFormData({
                        full_name: profile.full_name || '',
                        email: session.user.email,
                        avatar_url: profile.avatar_url || ''
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [router]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    // avatar_url logic would go here if we had file upload
                })
                .eq('id', user.id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
            router.refresh(); // Refresh to update header avatar/name
        } catch (err) {
            setMessage({ type: 'error', text: 'Erreur lors de la mise à jour.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen pt-40 text-center">Chargement...</div>;

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 border-l-8 border-orange-500 pl-4 py-1">
                        Mon Profil
                    </h1>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100">
                    {message && (
                        <div className={`p-4 rounded-xl mb-6 text-sm font-bold ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Email (Read Only) */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                            <input
                                type="text"
                                value={formData.email}
                                disabled
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-400 mt-1">L'adresse email ne peut pas être modifiée.</p>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Nom Complet</label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="Votre nom"
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        {/* Submit */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${saving
                                        ? 'bg-orange-300 cursor-wait'
                                        : 'bg-orange-600 hover:bg-orange-700 hover:shadow-orange-500/30'
                                    }`}
                            >
                                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
