'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DashboardBottomNav from '@/app/components/DashboardBottomNav';
import AppHeader from '@/app/components/AppHeader';
import { fal } from '@fal-ai/client';

fal.config({
    proxyUrl: '/api/fal/proxy',
});

export default function CreateMagicStoryPage() {
    const router = useRouter();

    // Auth & Data State
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [children, setChildren] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    // Flow State
    const [showChildSelector, setShowChildSelector] = useState(true);
    const [isAddingChild, setIsAddingChild] = useState(false);

    // Form State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        userPrompt: '',
        childName: '',
        childAge: 5,
        childGender: 'Fille',
        file: null
    });
    const [previewUrl, setPreviewUrl] = useState(null); // Image Preview State

    // Progress State
    const [progress, setProgress] = useState(0);
    const [loadingQuote, setLoadingQuote] = useState("Lancement de la magie...");

    const LOADING_QUOTES = [
        "Invocation des muses créatives...",
        "Affûtage des crayons magiques...",
        "Mélange des couleurs de l'imagination...",
        "Relecture par les lutins...",
        "Séchage de l'encre virtuelle...",
        "Préparation de la couverture..."
    ];

    // New Child Form State
    const [newChildData, setNewChildData] = useState({
        first_name: '',
        age: 5,
        gender: 'Fille' // or 'Garçon'
    });
    const [addingChildLoading, setAddingChildLoading] = useState(false);

    const safeParseInt = (value, fallback = 5) => {
        const parsed = parseInt(value);
        return isNaN(parsed) ? fallback : parsed;
    };

    // --- 1. Fetch Data on Mount ---
    useEffect(() => {
        async function loadData() {
            try {
                // User
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/login');
                    return;
                }
                setUser(session.user);

                // Profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                setProfile(profileData);

                // Children
                const { data: childrenData } = await supabase
                    .from('children')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: true });

                setChildren(childrenData || []);

                // Logic: Pre-fill if 1 child
                if (childrenData && childrenData.length === 1) {
                    const child = childrenData[0];
                    setFormData(prev => ({
                        ...prev,
                        childName: child.first_name,
                        childAge: safeParseInt(child.age), // Ensure integer
                        childGender: child.gender === 'boy' ? 'Garçon' : 'Fille'
                    }));
                }

            } catch (e) {
                console.error("Error loading data", e);
            } finally {
                setLoadingData(false);
            }
        }
        loadData();
    }, [router]);

    // Update FormData based on child object
    const mapGenderToDisplay = (gender) => {
        if (!gender) return 'Fille';
        const g = gender.toLowerCase();
        if (g === 'boy' || g === 'garçon') return 'Garçon';
        return 'Fille';
    };

    const mapGenderToDb = (displayGender) => {
        return displayGender === 'Garçon' ? 'boy' : 'girl';
    };

    const handleChildSelect = (child) => {
        setFormData(prev => ({
            ...prev,
            childName: child.first_name,
            childAge: safeParseInt(child.age), // Ensure integer
            childGender: mapGenderToDisplay(child.gender)
        }));
        setShowChildSelector(false); // Move to form
    };

    // --- New Child Logic ---
    const handleAddChild = async (e) => {
        e.preventDefault();
        setAddingChildLoading(true);
        try {
            const { data, error } = await supabase
                .from('children')
                .insert({
                    user_id: user.id,
                    first_name: newChildData.first_name,
                    age: safeParseInt(newChildData.age),
                    gender: mapGenderToDb(newChildData.gender)
                })
                .select()
                .single();

            if (error) throw error;

            // Success: Update local list, select this child, close modal
            setChildren(prev => [...prev, data]);
            handleChildSelect(data);
            setIsAddingChild(false);
            setNewChildData({ first_name: '', age: 5, gender: 'Fille' });

        } catch (err) {
            console.error("Error adding child", err);
            alert("Erreur lors de l'ajout de l'enfant.");
        } finally {
            setAddingChildLoading(false);
        }
    };


    // --- Form Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, file }));
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setProgress(0);

        // Start fancy loading simulation
        let quoteIndex = 0;
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) return 95;
                return prev + (Math.random() * 5); // Random increment
            });
        }, 500);

        const quoteInterval = setInterval(() => {
            quoteIndex = (quoteIndex + 1) % LOADING_QUOTES.length;
            setLoadingQuote(LOADING_QUOTES[quoteIndex]);
        }, 2000);

        try {
            let photoUrl = null;

            // 1. Upload Photo if present
            if (formData.file) {
                try {
                    const uploadResult = await fal.storage.upload(formData.file);
                    photoUrl = uploadResult;
                } catch (uploadError) {
                    console.error("Upload failed", uploadError);
                    setError("Impossible d'uploader la photo. Veuillez réessayer.");
                    setLoading(false);
                    return;
                }
            }

            // 2. Call Text Generation API
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            const response = await fetch('/api/magic/generate-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    userPrompt: formData.userPrompt,
                    childName: formData.childName,
                    childAge: formData.childAge,
                    childGender: formData.childGender,
                    childPhotoUrl: photoUrl
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la génération');
            }

            // 3. Redirect to Review Page
            router.push(`/dashboard/create/review/${data.bookId}`);

        } catch (err) {
            console.error(err);
            setError(err.message);
            setLoading(false);
        } finally {
            clearInterval(progressInterval);
            clearInterval(quoteInterval);
        }
    };

    if (loadingData) return <div className="min-h-screen pt-32 text-center text-gray-500">Chargement...</div>;

    return (
        <div className="min-h-screen bg-[#FFFDF7] pb-24">
            {/* Header */}
            <AppHeader user={user} profile={profile} />

            <main className="container mx-auto px-4 pt-32 max-w-2xl">

                {/* Child Selection / Addition Section */}
                {children.length > 0 && (
                    <div className="mb-8">
                        <label className="block text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Pour qui est cette histoire ?</label>
                        <div className="flex flex-wrap gap-3">
                            {children.map(child => (
                                <button
                                    key={child.id}
                                    type="button"
                                    onClick={() => handleChildSelect(child)}
                                    className={`px-5 py-2 rounded-full font-bold border-2 transition-all flex items-center gap-2 ${formData.childName === child.first_name
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
                                        }`}
                                >
                                    <span>{child.gender === 'boy' ? '👦🏾' : '👧🏾'}</span>
                                    {child.first_name}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setIsAddingChild(true)}
                                className="px-5 py-2 rounded-full font-bold border-2 border-dashed border-gray-300 text-gray-400 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition-all flex items-center gap-2"
                            >
                                <span>➕</span> Ajouter
                            </button>
                        </div>
                    </div>
                )}

                {/* Empty State (No children yet) */}
                {children.length === 0 && (
                    <div className="mb-8 p-6 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-orange-900">Premier enfant ?</h3>
                            <p className="text-sm text-orange-700">Ajoutez son profil pour gagner du temps la prochaine fois !</p>
                        </div>
                        <button
                            onClick={() => setIsAddingChild(true)}
                            className="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-sm"
                        >
                            Ajouter un enfant
                        </button>
                    </div>
                )}

                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-[#F0F0F0]">
                    <h2 className="text-2xl font-black text-[#333333] mb-2 font-chewy">L'aventure commence ici !</h2>
                    <p className="text-gray-500 mb-8">Remplissez les détails pour générer une histoire unique.</p>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Child Name */}
                        <div>
                            <label className="block text-sm font-semibold text-[#666666] mb-2">Prénom de l'enfant</label>
                            <input
                                type="text"
                                name="childName"
                                value={formData.childName}
                                onChange={handleChange}
                                required
                                className="w-full px-5 py-4 rounded-2xl border-2 border-[#F0F0F0] focus:border-[#FF5F6D] focus:ring-4 focus:ring-[#FF5F6D]/10 outline-none transition-all font-bold text-gray-800"
                                placeholder="Ex: Ama, Léo..."
                            />
                        </div>

                        {/* Age & Gender */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-[#666666] mb-2">Âge</label>
                                <select
                                    name="childAge"
                                    value={formData.childAge}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 rounded-2xl border-2 border-[#F0F0F0] focus:border-[#FF5F6D] bg-white outline-none font-bold text-gray-800"
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(age => (
                                        <option key={age} value={age}>{age} ans</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#666666] mb-2">Genre</label>
                                <select
                                    name="childGender"
                                    value={formData.childGender}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 rounded-2xl border-2 border-[#F0F0F0] focus:border-[#FF5F6D] bg-white outline-none font-bold text-gray-800"
                                >
                                    <option value="Fille">Fille</option>
                                    <option value="Garçon">Garçon</option>
                                </select>
                            </div>
                        </div>

                        {/* Story Idea */}
                        <div>
                            <label className="block text-sm font-semibold text-[#666666] mb-2">Ton idée d'histoire</label>
                            <textarea
                                name="userPrompt"
                                value={formData.userPrompt}
                                onChange={handleChange}
                                required
                                rows={4}
                                className="w-full px-5 py-4 rounded-2xl border-2 border-[#F0F0F0] focus:border-[#FF5F6D] focus:ring-4 focus:ring-[#FF5F6D]/10 outline-none transition-all resize-none font-medium text-gray-800"
                                placeholder="Ex: Un petit garçon qui voyage sur la lune avec son doudou..."
                            />
                            <p className="text-xs text-gray-400 mt-2 font-medium">✨ Plus tu donnes de détails, plus l'histoire sera unique !</p>
                        </div>

                        {/* Photo Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-[#666666] mb-2">Photo de l'enfant (Optionnel)</label>

                            {/* Preview Area or Upload Box */}
                            <div className="border-2 border-dashed border-[#E6E6E6] rounded-2xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative group overflow-hidden">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />

                                {previewUrl ? (
                                    <div className="relative z-0 flex flex-col items-center">
                                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-orange-300 shadow-md mb-3">
                                            <img src={previewUrl} alt="Aperçu" className="w-full h-full object-cover" />
                                        </div>
                                        <p className="text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full">
                                            {formData.file ? formData.file.name : "Photo sélectionnée"}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">Clique pour changer</p>
                                    </div>
                                ) : (
                                    <div className="pointer-events-none relative z-0 py-4">
                                        <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform">📸</span>
                                        <p className="text-sm font-bold text-gray-600">
                                            Clique pour ajouter une photo
                                        </p>
                                        <p className="text-xs text-[#999999] mt-2">Sert de référence pour les illustrations</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#FF5F6D] to-[#FFC371] hover:brightness-105 text-white font-black text-lg py-5 rounded-2xl shadow-xl shadow-orange-500/20 transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden relative"
                        >
                            {loading && (
                                <div
                                    className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            )}

                            {loading ? (
                                <span className="flex flex-col items-center justify-center relative z-10">
                                    <span className="flex items-center gap-3 mb-1">
                                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {Math.round(progress)}%
                                    </span>
                                    <span className="text-xs font-medium opacity-90 animate-pulse">
                                        {loadingQuote}
                                    </span>
                                </span>
                            ) : "✨ Générer l'Histoire"}
                        </button>

                    </form>
                </div>
            </main>

            {/* ADD CHILD MODAL */}
            {isAddingChild && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddingChild(false)}></div>
                    <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
                        <button
                            onClick={() => setIsAddingChild(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-black text-gray-900 mb-6">Ajouter un enfant</h3>

                        <form onSubmit={handleAddChild} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Prénom</label>
                                <input
                                    type="text"
                                    value={newChildData.first_name}
                                    onChange={e => setNewChildData(prev => ({ ...prev, first_name: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-500 outline-none font-bold"
                                    placeholder="Prénom"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Âge</label>
                                    <select
                                        value={newChildData.age}
                                        onChange={e => setNewChildData(prev => ({ ...prev, age: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-500 outline-none font-bold bg-white"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => <option key={n} value={n}>{n} ans</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Genre</label>
                                    <select
                                        value={newChildData.gender}
                                        onChange={e => setNewChildData(prev => ({ ...prev, gender: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-500 outline-none font-bold bg-white"
                                    >
                                        <option value="Fille">Fille</option>
                                        <option value="Garçon">Garçon</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={addingChildLoading}
                                className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all mt-4"
                            >
                                {addingChildLoading ? 'Ajout...' : 'Ajouter'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <DashboardBottomNav profile={profile} />
        </div>
    );
}
