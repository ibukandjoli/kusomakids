'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe outside component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// --- EXTRACTED COMPONENTS (Fixes Focus Issue) ---

const StepRole = ({ setRole, setStep }) => {
    const roles = [
        { id: 'parent', label: 'Super Papa', icon: '🦸‍♂️', color: 'bg-blue-100 text-blue-600 border-blue-200' },
        { id: 'parent', label: 'Super Maman', icon: '🦸‍♀️', color: 'bg-pink-100 text-pink-600 border-pink-200' },
        { id: 'grandparent', label: 'Grand-Parent', icon: '👵👴', color: 'bg-purple-100 text-purple-600 border-purple-200' },
        { id: 'uncle_aunt', label: 'Tonton / Tata', icon: '🎁', color: 'bg-green-100 text-green-600 border-green-200' },
        { id: 'other', label: 'Proche / Ami', icon: '✨', color: 'bg-orange-100 text-orange-600 border-orange-200' },
    ];

    return (
        <div className="animate-in fade-in slide-in-from-right duration-500">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">Qui va offrir de la magie ?</h2>
            <p className="text-gray-500 text-center mb-10">Dites-nous quel est votre super-pouvoir.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {roles.map((r, idx) => (
                    <button
                        key={idx}
                        onClick={() => { setRole(r.id); setStep(2); }}
                        className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all transform hover:scale-105 hover:shadow-xl ${r.color} border-transparent hover:border-current bg-opacity-50 hover:bg-opacity-100`}
                    >
                        <span className="text-5xl">{r.icon}</span>
                        <span className="font-bold text-lg">{r.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const StepChildren = ({ childrenList, setChildren, setStep }) => {

    // Helper to safely update a child at index
    const updateChild = (index, field, value) => {
        const newChildren = [...childrenList];
        newChildren[index][field] = value;
        setChildren(newChildren);
    };

    const addChild = () => {
        setChildren([...childrenList, { firstName: '', birthDate: '', gender: 'boy' }]);
    };

    const removeChild = (index) => {
        if (childrenList.length > 1) {
            setChildren(childrenList.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-right duration-500">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">Vos petits héros 🌟</h2>
            <p className="text-gray-500 text-center mb-10">Pour qui allons-nous écrire des histoires ?</p>

            <div className="max-w-2xl mx-auto space-y-6">
                {childrenList.map((child, index) => (
                    <div key={index} className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 relative">
                        {childrenList.length > 1 && (
                            <button onClick={() => removeChild(index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
                                ✕
                            </button>
                        )}
                        <h3 className="font-bold text-gray-400 mb-4 uppercase text-xs tracking-wider">Enfant {index + 1}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Prénom</label>
                                <input
                                    type="text"
                                    // Use 'key' logic effectively in parent or ensure stability. 
                                    // Here, react controls input.
                                    value={child.firstName}
                                    onChange={(e) => updateChild(index, 'firstName', e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="Ex: Ama"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Date de naissance</label>
                                <input
                                    type="date"
                                    value={child.birthDate}
                                    onChange={(e) => updateChild(index, 'birthDate', e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Genre</label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => updateChild(index, 'gender', 'boy')}
                                        className={`flex-1 p-3 rounded-xl border-2 font-bold transition-colors ${child.gender === 'boy' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-400 hover:border-blue-200'}`}
                                    >
                                        Garçon 👦🏾
                                    </button>
                                    <button
                                        onClick={() => updateChild(index, 'gender', 'girl')}
                                        className={`flex-1 p-3 rounded-xl border-2 font-bold transition-colors ${child.gender === 'girl' ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-400 hover:border-pink-200'}`}
                                    >
                                        Fille 👧🏾
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <button onClick={addChild} className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 font-bold hover:border-orange-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-2">
                    <span>+</span> Ajouter un autre enfant
                </button>

                <div className="flex justify-end pt-6">
                    <button
                        onClick={() => setStep(3)}
                        // Basic validation check
                        disabled={childrenList.some(c => !c.firstName || !c.birthDate)}
                        className="bg-orange-600 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-orange-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Continuer →
                    </button>
                </div>
            </div>
        </div>
    );
};

const StepInterests = ({ interests, setInterests, onSave, loading }) => {
    const tags = [
        "🦁 Animaux", "🚀 Espace", "👑 Princes & Princesses", "🦸 Super-héros",
        "🌿 Nature", "⚽ Sport", "🎨 Art & Dessin", "🚒 Pompiers/Métiers",
        "🦕 Dinosaures", "🧚 Magie", "🌊 Océan", "🚗 Voitures",
        "🏰 Châteaux", "🤖 Robots", "🎸 Musique"
    ];

    const toggleInterest = (tag) => {
        if (interests.includes(tag)) {
            setInterests(interests.filter(i => i !== tag));
        } else {
            setInterests([...interests, tag]);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-right duration-500">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">Qu'est-ce qui les fait rêver ? 💭</h2>
            <p className="text-gray-500 text-center mb-10">Sélectionnez leurs passions pour des histoires sur-mesure.</p>

            <div className="max-w-3xl mx-auto">
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {tags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => toggleInterest(tag)}
                            className={`px-6 py-3 rounded-full font-bold text-sm md:text-base transition-all transform hover:scale-105 ${interests.includes(tag)
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={onSave}
                        disabled={loading}
                        className={`bg-green-600 text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-green-700 transition-all shadow-xl hover:shadow-green-600/30 transform hover:-translate-y-1 flex items-center gap-3 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {loading ? 'Finalisation...' : '✨ Accéder à mon espace'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);

    // Data State
    const [role, setRole] = useState(null);
    const [children, setChildren] = useState([{ firstName: '', birthDate: '', gender: 'boy' }]); // Start with 1 child
    const [interests, setInterests] = useState([]);

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/signup'); // Protect route
            } else {
                setUser(session.user);
            }
        };
        getUser();
    }, [router]);

    // Save Data Logic
    const saveProfileData = async () => {
        setLoading(true);
        try {
            // 1. Update Profile Role
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ role: role })
                .eq('id', user.id);
            if (profileError) throw profileError;

            // 2. Insert Children
            const childrenData = children.map(child => ({
                user_id: user.id,
                first_name: child.firstName,
                birth_date: child.birthDate,
                gender: child.gender,
                interests: interests
            }));

            const { error: childrenError } = await supabase
                .from('children')
                .insert(childrenData);

            if (childrenError) throw childrenError;

            // Success - Redirect to Dashboard (Freemium Flow)
            router.push('/dashboard');

        } catch (error) {
            console.error("Save Data Error:", error);
            alert("Erreur de sauvegarde: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-orange-50 pt-20 pb-12">
            <div className="container mx-auto px-4">
                {/* Progress Bar */}
                <div className="max-w-xl mx-auto mb-12 flex gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                    ))}
                </div>

                {step === 1 && <StepRole setRole={setRole} setStep={setStep} />}

                {step === 2 && (
                    <StepChildren
                        childrenList={children}
                        setChildren={setChildren}
                        setStep={setStep}
                    />
                )}

                {step === 3 && (
                    <StepInterests
                        interests={interests}
                        setInterests={setInterests}
                        onSave={saveProfileData}
                        loading={loading}
                    />
                )}

            </div>
        </div>
    );
}
