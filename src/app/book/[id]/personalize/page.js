'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

import { fal } from '@fal-ai/client';

fal.config({
    proxyUrl: '/api/fal/proxy',
});

export default function PersonalizePage() {
    const params = useParams();
    const router = useRouter();
    const [book, setBook] = useState(null);
    const [formData, setFormData] = useState({
        childName: '',
        gender: 'boy',
        age: '',
        photo: null
    });
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBook() {
            if (!params?.id) return;
            try {
                const { data, error } = await supabase
                    .from('story_templates')
                    .select('*')
                    .eq('id', params.id)
                    .single();
                if (error) throw error;
                setBook(data);
            } catch (err) {
                console.error('Error fetching book:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchBook();
    }, [params.id]);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, photo: file });
            setPreviewUrl(URL.createObjectURL(file));
            // In a real app, integrate Supabase Storage upload here
        }
    };

    // ... inside component

    // ... inside component

    const [uploading, setUploading] = useState(false);

    // ... handlePhotoChange stays same

    const handleCheckout = async () => {
        if (!formData.photo) return;
        setUploading(true);

        try {
            // Upload photo to Fal Storage
            let photoUrl = null;
            if (formData.photo) {
                photoUrl = await fal.storage.upload(formData.photo);
            }

            // Save to local storage for checkout
            const orderData = {
                bookId: book.id,
                bookTitle: book.title,
                price: 3000,
                personalization: {
                    childName: formData.childName,
                    gender: formData.gender,
                    age: formData.age,
                    photoUrl: photoUrl // usage of real URL
                },
                coverUrl: book.cover_url // Pass the cover URL for checkout display
            };

            // Simplistic cart management
            localStorage.setItem('cart_item', JSON.stringify(orderData));
            router.push(`/book/${book.id}/preview`);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Erreur lors de l'envoi de la photo. Veuillez réessayer.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="min-h-screen pt-32 text-center">Chargement...</div>;
    if (!book) return <div className="min-h-screen pt-32 text-center">Livre introuvable</div>;

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="container mx-auto px-4 max-w-6xl">

                <div className="grid lg:grid-cols-2 gap-12">

                    {/* LEFT: Form */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm h-fit">
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">Personnalisons l'histoire !</h1>

                        <div className="space-y-6">

                            {/* Photo Upload */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Photo de l'enfant</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 relative">
                                        {previewUrl ? (
                                            <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                                        ) : (
                                            <span className="text-4xl">📸</span>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                    />
                                </div>
                                <div className="flex gap-2 mt-4 text-xs font-medium text-gray-500">
                                    <span className="flex items-center gap-1"><span className="text-green-500">✅</span> Bonne lumière</span>
                                    <span className="flex items-center gap-1"><span className="text-red-500">❌</span> Pas de lunettes</span>
                                    <span className="flex items-center gap-1"><span className="text-red-500">❌</span> Seul(e)</span>
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Prénom de l'enfant</label>
                                <input
                                    type="text"
                                    value={formData.childName}
                                    onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Ex: Aminata"
                                />
                            </div>

                            {/* Gender */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">C'est...</label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setFormData({ ...formData, gender: 'girl' })}
                                        className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${formData.gender === 'girl' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-500'}`}
                                    >
                                        Une Fille 👧
                                    </button>
                                    <button
                                        onClick={() => setFormData({ ...formData, gender: 'boy' })}
                                        className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${formData.gender === 'boy' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-500'}`}
                                    >
                                        Un Garçon 👦
                                    </button>
                                </div>
                            </div>

                            {/* Age */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Âge (Optionnel)</label>
                                <input
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Ex: 5"
                                />
                            </div>

                        </div>
                    </div>

                    {/* RIGHT: Illustration & CTA */}
                    <div className="relative flex flex-col justify-center">
                        <div className="sticky top-32 text-center">

                            {/* Illustration placeholder */}
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-orange-100 mb-8 transform rotate-2 max-w-sm mx-auto">
                                <div className="aspect-[3/4] relative overflow-hidden rounded-2xl bg-orange-50 mb-4">
                                    {book && book.cover_url ? (
                                        <Image src={book.cover_url} alt={book.title} fill className="object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-orange-200">
                                            <span className="text-6xl">📖</span>
                                        </div>
                                    )}
                                    {previewUrl && (
                                        <div className="absolute bottom-4 right-4 w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden z-20">
                                            <Image src={previewUrl} alt="Child" fill className="object-cover" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{book ? book.title : '...'}</h3>
                                <p className="text-gray-500 text-sm">Une aventure unique pour {formData.childName || 'votre enfant'}</p>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={!formData.childName || uploading}
                                className={`w-full max-w-sm mx-auto py-5 rounded-2xl font-bold text-xl transition-all shadow-xl flex items-center justify-center gap-2 ${formData.childName && !uploading
                                    ? 'bg-orange-500 hover:bg-orange-600 text-white hover:-translate-y-1 shadow-orange-500/30'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {uploading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Envoi en cours...
                                    </>
                                ) : (
                                    'Lancer la personnalisation 🚀'
                                )}
                            </button>
                            <p className="text-center text-sm text-gray-500 mt-3 font-medium">
                                Cela prend environ 45 secondes ⏱️
                            </p>
                            <p className="text-gray-400 text-xs mt-4">
                                Étape suivante : Prévisualisation de l'histoire
                            </p>

                        </div>
                    </div>

                </div>

            </div>
        </div >
    );
}
