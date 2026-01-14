'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatTitle } from '@/utils/format';
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
        age: '4',
        photo: null
    });
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    // Helper to check UUID
    const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    useEffect(() => {
        async function fetchBook() {
            if (!params?.slug) return;
            try {
                let query = supabase.from('story_templates').select('*').single();

                if (isUUID(params.slug)) {
                    query = query.eq('id', params.slug);
                } else {
                    query = query.eq('theme_slug', params.slug);
                }

                const { data, error } = await query;

                if (error) throw error;
                setBook(data);
            } catch (err) {
                console.error('Error fetching book:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchBook();
    }, [params.slug]);

    const [uploadSuccess, setUploadSuccess] = useState(false);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, photo: file });
            setPreviewUrl(URL.createObjectURL(file));
            setUploadSuccess(true);
        }
    };

    const [uploading, setUploading] = useState(false);

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

    if (loading) return <div className="min-h-screen pt-32 text-center text-orange-500 font-bold">Chargement de la magie...</div>;
    if (!book) return <div className="min-h-screen pt-32 text-center">Livre introuvable</div>;

    return (
        <div className="min-h-screen pt-32 pb-20 relative bg-[#FAFAF8]">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'url(/images/pattern_bg.png)', backgroundSize: '400px' }}></div>

            <div className="container mx-auto px-4 max-w-6xl relative z-10">

                <div className="grid lg:grid-cols-2 gap-12 items-start">

                    {/* LEFT: Form */}
                    <div className="bg-white/90 backdrop-blur-sm p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-white/50 h-fit transition-all hover:shadow-2xl">
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Personnalisons l'histoire !</h1>
                        <p className="text-gray-500 mb-8 font-medium">Pour qu'elle soit unique, comme votre enfant.</p>

                        <div className="space-y-8">

                            {/* Photo Upload - Centered Mobile Stack */}
                            <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100">
                                <label className="block text-lg font-bold text-gray-800 mb-4 text-center md:text-left">Photo du petit héros 📸</label>
                                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                                    {/* Preview Circle - Larger */}
                                    <div className="w-32 h-32 md:w-28 md:h-28 rounded-full bg-white shadow-sm flex-shrink-0 flex items-center justify-center overflow-hidden border-4 border-white ring-2 ring-orange-100 relative group transition-transform hover:scale-105">
                                        {previewUrl ? (
                                            <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                                        ) : (
                                            <span className="text-5xl md:text-4xl text-gray-300">😊</span>
                                        )}
                                    </div>

                                    {/* Controls */}
                                    <div className="flex-1 w-full text-center md:text-left">
                                        <label className="cursor-pointer inline-block px-8 py-3 bg-white border-2 border-orange-200 text-orange-700 font-bold rounded-2xl hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm active:scale-95">
                                            Choisir une photo
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                                className="hidden"
                                            />
                                        </label>

                                        {/* Photo Tips - Horizontal Row Centered */}
                                        <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-6">
                                            {[
                                                { icon: "👤", text: "Solo" },
                                                { icon: "🌞", text: "Lumière" },
                                                { icon: "🚫", text: "No Cache" },
                                                { icon: "✨", text: "Visage" }
                                            ].map((tip, i) => (
                                                <div key={i} className="flex flex-col items-center bg-white/60 p-2 rounded-xl border border-orange-50 w-16 md:w-20">
                                                    <span className="text-xl mb-1">{tip.icon}</span>
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase leading-none">{tip.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Identity Section - Name & Age Inline */}
                            <div className="space-y-6">
                                <label className="block text-lg font-bold text-gray-800 mb-2">Son identité</label>

                                <div className="flex gap-4">
                                    {/* Name (70%) */}
                                    <div className="flex-[7]">
                                        <input
                                            type="text"
                                            value={formData.childName}
                                            onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                                            className="w-full px-5 py-4 text-lg rounded-2xl border-2 border-gray-100 bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all placeholder:text-gray-300 font-bold text-gray-700"
                                            placeholder="Prénom"
                                        />
                                    </div>

                                    {/* Age (30%) */}
                                    <div className="flex-[3]">
                                        <input
                                            type="number"
                                            value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                            className="w-full px-2 py-4 text-center text-lg rounded-2xl border-2 border-gray-100 bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all placeholder:text-gray-300 font-bold text-gray-700"
                                            placeholder="Âge"
                                        />
                                    </div>
                                </div>

                                {/* Gender - Full Width Blocks */}
                                <div>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, gender: 'girl' })}
                                            className={`flex-1 py-4 px-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 border-2 ${formData.gender === 'girl'
                                                ? 'bg-orange-500 border-orange-500 text-white shadow-lg transform scale-[1.02]'
                                                : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                        >
                                            <span className="text-3xl">👧🏾</span>
                                            <span>Fille</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, gender: 'boy' })}
                                            className={`flex-1 py-4 px-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 border-2 ${formData.gender === 'boy'
                                                ? 'bg-orange-500 border-orange-500 text-white shadow-lg transform scale-[1.02]'
                                                : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                        >
                                            <span className="text-3xl">👦🏾</span>
                                            <span>Garçon</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* RIGHT: Illustration & CTA */}
                    <div className="relative flex flex-col justify-center lg:pt-10">
                        <div className="sticky top-32 text-center">

                            {/* Book Preview Card */}
                            <div className="bg-white rounded-[2.5rem] p-4 pb-8 shadow-2xl shadow-orange-500/10 border-4 border-white mb-8 transform hover:rotate-1 transition-transform duration-500 max-w-sm mx-auto relative group">
                                <div className="absolute -top-6 -right-6 bg-yellow-400 text-yellow-900 font-black px-4 py-2 rounded-xl rotate-12 shadow-lg z-20 text-sm">
                                    Best-Seller ⭐
                                </div>
                                <div className="aspect-[3/4] relative overflow-hidden rounded-[2rem] bg-orange-50 mb-6 shadow-inner">
                                    {book && book.cover_url ? (
                                        <Image src={book.cover_url} alt={book.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-orange-200">
                                            <span className="text-6xl">📖</span>
                                        </div>
                                    )}
                                    {/* Floating Avatar Bubble */}
                                    {previewUrl && (
                                        <div className="absolute -bottom-2 -right-2 w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden z-20 animate-in zoom-in spin-in-3">
                                            <Image src={previewUrl} alt="Child" fill className="object-cover" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2 px-4 leading-tight">
                                    {book ? formatTitle(book.title).replace('[Son prénom]', formData.childName || 'Votre Enfant') : '...'}
                                </h3>
                                <p className="text-gray-500 font-medium text-sm">Une aventure magique écrite pour {formData.childName || 'lui/elle'}</p>
                            </div>

                            {/* Magic CTA */}
                            <button
                                onClick={handleCheckout}
                                disabled={!formData.childName || uploading}
                                className={`w-full max-w-sm mx-auto py-5 px-6 rounded-2xl font-black text-xl transition-all shadow-xl group relative overflow-hidden ${formData.childName && !uploading
                                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:scale-105 hover:shadow-orange-500/40'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {uploading ? (
                                        <>
                                            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Préparation de la magie...
                                        </>
                                    ) : (
                                        <>Créer la magie maintenant ✨</>
                                    )}
                                </span>
                                {formData.childName && !uploading && (
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                )}
                            </button>

                            <p className="text-center text-sm text-gray-500 mt-4 font-bold flex items-center justify-center gap-1 opacity-80">
                                <span>⏱️</span> Cela prend environ 45 secondes
                            </p>

                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
