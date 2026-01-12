'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FamilyTab({ user }) {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // New Child State
    const [newChild, setNewChild] = useState({ firstName: '', birthDate: '', gender: 'boy', interests: [] });

    // Interests List (Shared)
    const availableInterests = [
        "🦁 Animaux", "🚀 Espace", "👑 Princes & Princesses", "🦸 Super-héros",
        "🌿 Nature", "⚽ Sport", "🎨 Art & Dessin", "🚒 Pompiers/Métiers",
        "🦕 Dinosaures", "🧚 Magie", "🌊 Océan", "🚗 Voitures"
    ];

    useEffect(() => {
        fetchChildren();
    }, []);

    const fetchChildren = async () => {
        try {
            const { data, error } = await supabase
                .from('children')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });
            if (error) throw error;
            setChildren(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddChild = async () => {
        if (!newChild.firstName) return;
        try {
            const { data, error } = await supabase
                .from('children')
                .insert([{
                    user_id: user.id,
                    first_name: newChild.firstName,
                    birth_date: newChild.birthDate || null,
                    gender: newChild.gender,
                    interests: newChild.interests
                }])
                .select();

            if (error) throw error;

            setChildren([...children, data[0]]);
            setIsAdding(false);
            setNewChild({ firstName: '', birthDate: '', gender: 'boy', interests: [] });
        } catch (error) {
            console.error("Error adding child:", error);
            alert("Erreur lors de l'ajout.");
        }
    };

    const deleteChild = async (id) => {
        if (!confirm("Voulez-vous vraiment retirer cet enfant de la famille ?")) return;
        try {
            const { error } = await supabase.from('children').delete().eq('id', id);
            if (error) throw error;
            setChildren(children.filter(c => c.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const toggleInterest = (tag) => {
        const currentbits = newChild.interests || [];
        if (currentbits.includes(tag)) {
            setNewChild({ ...newChild, interests: currentbits.filter(t => t !== tag) });
        } else {
            setNewChild({ ...newChild, interests: [...currentbits, tag] });
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement de la famille...</div>;

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Mes Petits Lecteurs 👶</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-600 transition-colors"
                >
                    {isAdding ? 'Annuler' : '+ Ajouter'}
                </button>
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="bg-white p-6 rounded-3xl border-2 border-green-100 mb-8 shadow-sm">
                    <h3 className="font-bold text-lg mb-4">Nouveau profil</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Prénom</label>
                            <input
                                type="text"
                                value={newChild.firstName}
                                onChange={(e) => setNewChild({ ...newChild, firstName: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-200"
                                placeholder="Ex: Aya"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Date de naissance</label>
                            <input
                                type="date"
                                value={newChild.birthDate}
                                onChange={(e) => setNewChild({ ...newChild, birthDate: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Genre</label>
                            <div className="flex gap-2">
                                <button onClick={() => setNewChild({ ...newChild, gender: 'boy' })} className={`flex-1 p-2 rounded border ${newChild.gender === 'boy' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200'}`}>Garçon</button>
                                <button onClick={() => setNewChild({ ...newChild, gender: 'girl' })} className={`flex-1 p-2 rounded border ${newChild.gender === 'girl' ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-200'}`}>Fille</button>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Ses passions</label>
                        <div className="flex flex-wrap gap-2">
                            {availableInterests.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleInterest(tag)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border ${newChild.interests?.includes(tag) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200'}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleAddChild}
                        disabled={!newChild.firstName}
                        className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50"
                    >
                        Enregistrer
                    </button>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {children.map((child) => (
                    <div key={child.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative group">
                        <button
                            onClick={() => deleteChild(child.id)}
                            className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            🗑️
                        </button>
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${child.gender === 'boy' ? 'bg-blue-100' : 'bg-pink-100'}`}>
                                {child.gender === 'boy' ? '👦🏾' : '👧🏾'}
                            </div>
                            <div>
                                <h3 className="font-bold text-xl">{child.first_name}</h3>
                                {child.birth_date && (
                                    <p className="text-sm text-gray-500">
                                        {new Date().getFullYear() - new Date(child.birth_date).getFullYear()} ans
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {child.interests && child.interests.map((tag, i) => (
                                <span key={i} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-lg">{tag}</span>
                            ))}
                        </div>
                    </div>
                ))}

                {children.length === 0 && !isAdding && (
                    <div className="col-span-full text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 mb-4">Aucun enfant ajouté pour le moment</p>
                        <button onClick={() => setIsAdding(true)} className="text-green-600 font-bold hover:underline">Ajouter le premier</button>
                    </div>
                )}
            </div>
        </div>
    );
}
