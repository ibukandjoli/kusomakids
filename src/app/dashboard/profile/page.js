'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DashboardBottomNav from '../../components/DashboardBottomNav';
import Link from 'next/link';

const ROLE_MAP = {
    parent: { label: 'Super Parent', icon: '🦸' },
    grandparent: { label: 'Grand-Parent', icon: '👵' },
    uncle_aunt: { label: 'Tonton / Tata', icon: '🎁' },
    other: { label: 'Proche / Ami', icon: '✨' },
};

const INTEREST_LABELS = {
    animals: '🐾 Animaux',
    space: '🚀 Espace',
    princesses: '👸 Princesses',
    dinosaurs: '🦕 Dinosaures',
    sports: '⚽ Sports',
    music: '🎵 Musique',
    nature: '🌿 Nature',
    science: '🔬 Sciences',
    cooking: '🍳 Cuisine',
    adventure: '🗺️ Aventure',
    superheroes: '🦸 Super-héros',
    magic: '✨ Magie',
};

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [children, setChildren] = useState([]);
    const [formData, setFormData] = useState({ full_name: '', email: '' });
    const [message, setMessage] = useState(null);

    // Child editing
    const [editingChild, setEditingChild] = useState(null); // index or null
    const [childForm, setChildForm] = useState({ first_name: '', birth_date: '', gender: 'boy' });
    const [savingChild, setSavingChild] = useState(false);
    const [showAddChild, setShowAddChild] = useState(false);
    const [newChildForm, setNewChildForm] = useState({ first_name: '', birth_date: '', gender: 'boy' });

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

                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                setProfile(profileData);
                setFormData({
                    full_name: profileData?.full_name || '',
                    email: session.user.email,
                });

                const { data: childrenData } = await supabase
                    .from('children')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: true });

                setChildren(childrenData || []);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: formData.full_name })
                .eq('id', user.id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Profil mis à jour !' });
            router.refresh();
        } catch (err) {
            setMessage({ type: 'error', text: 'Erreur lors de la mise à jour.' });
        } finally {
            setSaving(false);
        }
    };

    const startEditChild = (index) => {
        const child = children[index];
        setChildForm({
            first_name: child.first_name || '',
            birth_date: child.birth_date || '',
            gender: child.gender || 'boy',
        });
        setEditingChild(index);
    };

    const saveChild = async (childId) => {
        setSavingChild(true);
        try {
            const { error } = await supabase
                .from('children')
                .update({
                    first_name: childForm.first_name,
                    birth_date: childForm.birth_date || null,
                    gender: childForm.gender,
                })
                .eq('id', childId);

            if (error) throw error;

            // Update local state
            setChildren(prev => prev.map(c =>
                c.id === childId ? { ...c, ...childForm } : c
            ));
            setEditingChild(null);
            setMessage({ type: 'success', text: 'Enfant mis à jour !' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Erreur lors de la mise à jour.' });
        } finally {
            setSavingChild(false);
        }
    };

    const addChild = async () => {
        if (!newChildForm.first_name.trim()) return;
        setSavingChild(true);
        try {
            const { data, error } = await supabase
                .from('children')
                .insert({
                    user_id: user.id,
                    first_name: newChildForm.first_name,
                    birth_date: newChildForm.birth_date || null,
                    gender: newChildForm.gender,
                    interests: [],
                })
                .select()
                .single();

            if (error) throw error;

            setChildren(prev => [...prev, data]);
            setNewChildForm({ first_name: '', birth_date: '', gender: 'boy' });
            setShowAddChild(false);
            setMessage({ type: 'success', text: `${data.first_name} a été ajouté(e) !` });
        } catch (err) {
            setMessage({ type: 'error', text: 'Erreur: ' + err.message });
        } finally {
            setSavingChild(false);
        }
    };

    const getAge = (birthDate) => {
        if (!birthDate) return null;
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    if (loading) return <div className="min-h-screen pt-40 text-center">Chargement...</div>;

    const roleInfo = ROLE_MAP[profile?.role] || ROLE_MAP.parent;
    const isMember = profile?.subscription_status === 'active';

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20">
            <div className="container mx-auto px-4 max-w-2xl">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 border-l-8 border-orange-500 pl-4 py-1">
                        Mon Profil
                    </h1>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl mb-6 text-sm font-bold ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                {/* ===== ROLE BADGE ===== */}
                <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 text-[120px] opacity-10 leading-none -mt-4 -mr-4 pointer-events-none">
                        {roleInfo.icon}
                    </div>
                    <div className="relative z-10">
                        <span className="text-4xl mr-3">{roleInfo.icon}</span>
                        <h2 className="text-2xl font-black inline-block align-middle">{roleInfo.label}</h2>
                        <p className="text-white/80 text-sm mt-2 ml-1">Votre super-pouvoir sur KusomaKids</p>
                    </div>
                    {isMember && (
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            🌟 Club VIP
                        </div>
                    )}
                </div>

                {/* ===== PERSONAL INFO ===== */}
                <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm">👤</span>
                        Informations personnelles
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-5">
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
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Nom Complet</label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="Votre nom"
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md text-sm ${saving
                                ? 'bg-orange-300 cursor-wait'
                                : 'bg-orange-600 hover:bg-orange-700'
                                }`}
                        >
                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </form>
                </div>

                {/* ===== CHILDREN ===== */}
                <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-8 h-8 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center text-sm">👶</span>
                            Mes petits héros
                        </h3>
                        <button
                            onClick={() => setShowAddChild(true)}
                            className="text-orange-600 hover:text-orange-700 text-sm font-bold flex items-center gap-1 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <span className="text-lg">+</span> Ajouter
                        </button>
                    </div>

                    {children.length === 0 ? (
                        <div className="text-center py-8">
                            <span className="text-4xl block mb-3">🧸</span>
                            <p className="text-gray-500 text-sm">Aucun enfant ajouté pour le moment.</p>
                            <button
                                onClick={() => setShowAddChild(true)}
                                className="mt-4 text-orange-600 font-bold text-sm hover:underline"
                            >
                                Ajouter mon premier héros →
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {children.map((child, index) => {
                                const age = getAge(child.birth_date);
                                const isEditing = editingChild === index;

                                return (
                                    <div key={child.id} className="border border-gray-100 rounded-2xl p-5 hover:border-orange-200 transition-colors">
                                        {isEditing ? (
                                            /* Edit Mode */
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 mb-1">Prénom</label>
                                                        <input
                                                            type="text"
                                                            value={childForm.first_name}
                                                            onChange={(e) => setChildForm({ ...childForm, first_name: e.target.value })}
                                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 mb-1">Date de naissance</label>
                                                        <input
                                                            type="date"
                                                            value={childForm.birth_date || ''}
                                                            onChange={(e) => setChildForm({ ...childForm, birth_date: e.target.value })}
                                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">Genre</label>
                                                    <div className="flex gap-3">
                                                        {[{ v: 'boy', l: '👦 Garçon' }, { v: 'girl', l: '👧 Fille' }].map(g => (
                                                            <button
                                                                key={g.v}
                                                                type="button"
                                                                onClick={() => setChildForm({ ...childForm, gender: g.v })}
                                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${childForm.gender === g.v
                                                                    ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                                                                    : 'bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100'
                                                                    }`}
                                                            >
                                                                {g.l}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 pt-2">
                                                    <button
                                                        onClick={() => saveChild(child.id)}
                                                        disabled={savingChild}
                                                        className="bg-orange-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-orange-700 disabled:opacity-50"
                                                    >
                                                        {savingChild ? '...' : 'Enregistrer'}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingChild(null)}
                                                        className="text-gray-500 px-4 py-2 text-sm hover:text-gray-700"
                                                    >
                                                        Annuler
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* View Mode */
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${child.gender === 'girl'
                                                        ? 'bg-pink-100'
                                                        : 'bg-blue-100'
                                                        }`}>
                                                        {child.gender === 'girl' ? '👧' : '👦'}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{child.first_name}</h4>
                                                        <p className="text-sm text-gray-500">
                                                            {age !== null ? `${age} ans` : 'Âge non renseigné'}
                                                            {child.birth_date && (
                                                                <span className="text-gray-400 ml-1">
                                                                    · 🎂 {new Date(child.birth_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                                                </span>
                                                            )}
                                                        </p>
                                                        {child.interests && child.interests.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                                {child.interests.map((interest, i) => (
                                                                    <span key={i} className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md text-xs font-medium">
                                                                        {INTEREST_LABELS[interest] || interest}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => startEditChild(index)}
                                                    className="text-gray-400 hover:text-orange-600 p-2 rounded-lg hover:bg-orange-50 transition-colors"
                                                    title="Modifier"
                                                >
                                                    ✏️
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Add Child Form */}
                    {showAddChild && (
                        <div className="mt-6 border-2 border-dashed border-orange-200 rounded-2xl p-5 bg-orange-50/50">
                            <h4 className="font-bold text-gray-900 mb-4 text-sm">Nouveau petit héros</h4>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Prénom *</label>
                                    <input
                                        type="text"
                                        value={newChildForm.first_name}
                                        onChange={(e) => setNewChildForm({ ...newChildForm, first_name: e.target.value })}
                                        placeholder="Prénom de l'enfant"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Date de naissance</label>
                                    <input
                                        type="date"
                                        value={newChildForm.birth_date}
                                        onChange={(e) => setNewChildForm({ ...newChildForm, birth_date: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Genre</label>
                                <div className="flex gap-3">
                                    {[{ v: 'boy', l: '👦 Garçon' }, { v: 'girl', l: '👧 Fille' }].map(g => (
                                        <button
                                            key={g.v}
                                            type="button"
                                            onClick={() => setNewChildForm({ ...newChildForm, gender: g.v })}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${newChildForm.gender === g.v
                                                ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                                                : 'bg-white text-gray-500 border-2 border-transparent hover:bg-gray-100'
                                                }`}
                                        >
                                            {g.l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={addChild}
                                    disabled={savingChild || !newChildForm.first_name.trim()}
                                    className="bg-orange-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {savingChild ? 'Ajout...' : 'Ajouter'}
                                </button>
                                <button
                                    onClick={() => { setShowAddChild(false); setNewChildForm({ first_name: '', birth_date: '', gender: 'boy' }); }}
                                    className="text-gray-500 px-4 py-2 text-sm hover:text-gray-700"
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ===== CTA for non-members ===== */}
                {!isMember && (
                    <div className="bg-gradient-to-r from-orange-50 to-pink-50 border-2 border-orange-100 rounded-3xl p-8 text-center">
                        <span className="text-4xl block mb-3">🌟</span>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Offrez plus de magie à {children[0]?.first_name || 'vos enfants'} !
                        </h3>
                        <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
                            Rejoignez le Club Kusoma pour accéder à toutes les histoires, le mode Magic Story, et 1 PDF gratuit/mois.
                        </p>
                        <Link
                            href="/dashboard/billing"
                            className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg hover:scale-105 transition-all"
                        >
                            Rejoindre le Club →
                        </Link>
                    </div>
                )}
            </div>

            <DashboardBottomNav />
        </div>
    );
}
