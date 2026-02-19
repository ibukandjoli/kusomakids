'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DashboardBottomNav from '@/app/components/DashboardBottomNav';
import { FaPen, FaMagic, FaSave, FaBookOpen, FaList } from 'react-icons/fa';
import confetti from 'canvas-confetti';

export default function ReviewStoryPage({ params }) {
    // Unwrap params using React.use()
    const { bookId } = use(params);

    const router = useRouter();
    const [book, setBook] = useState(null);
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0); // Fake progress for UX
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        fetchBook();
    }, [bookId]);

    const fetchBook = async () => {
        const { data, error } = await supabase
            .from('generated_books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (error) {
            console.error(error);
            router.push('/dashboard/create');
            return;
        }

        setBook(data);
        if (data.story_content?.pages) {
            setPages(data.story_content.pages);
        }
        setLoading(false);
    };

    const handleTextChange = (index, newText) => {
        const newPages = [...pages];
        newPages[index].text = newText;
        setPages(newPages);
    };

    const saveChanges = async () => {
        const newContent = { ...book.story_content, pages: pages };
        const { error } = await supabase
            .from('generated_books')
            .update({ story_content: newContent })
            .eq('id', bookId);

        if (error) alert("Erreur de sauvegarde");
    };

    const handleGenerateImages = async () => {
        console.log("🎨 GÉNÉRATION DÉMARRÉE - Button clicked!");

        // 1. Save Text First
        await saveChanges();

        // 2. Start Generation
        setGenerating(true);

        // Fake progress animation
        const interval = setInterval(() => {
            setProgress(old => {
                if (old >= 90) return 90;
                return old + 1;
            });
        }, 1000); // +1% every second -> 90s (1.5 min) roughly matches generation time

        try {
            console.log("📡 Calling worker API...");
            const response = await fetch('/api/workers/generate-magic-book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookId,
                    pages: pages // Pass current text edits directly to worker
                })
            });

            const result = await response.json();
            console.log("📥 Worker response:", result);

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Erreur de génération");
            }

            // Success!
            clearInterval(interval);
            setProgress(100);

            // Trigger Confetti
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FF5F6D', '#FFC371', '#ffffff', '#4ade80']
            });

            // Show Modal instead of redirect
            setGenerating(false);
            setShowSuccessModal(true);

        } catch (err) {
            console.error("❌ Generation error:", err);
            clearInterval(interval);
            setGenerating(false);
            alert("Une erreur est survenue lors de la génération des images : " + err.message);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#FFFDF7] flex items-center justify-center p-4">Chargement...</div>;

    if (generating) {
        return (
            <div className="min-h-screen bg-[#FFFDF7] flex flex-col items-center justify-center p-8 text-center sticky top-0 z-50">
                <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-[#F0F0F0]">
                    <div className="text-6xl mb-6 animate-bounce">🎨</div>
                    <h2 className="text-2xl font-bold text-[#3D3D3D] mb-4">Création de vos illustrations...</h2>
                    <p className="text-[#666666] mb-8">
                        Nos artistes magiques dessinent votre histoire. Cela prend environ 2 à 3 minutes.
                        <br />
                        <span className="font-bold text-red-500 block mt-2">Ne fermez pas cette page !</span>
                    </p>

                    <div className="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden">
                        <div
                            className="bg-[#FF5F6D] h-4 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-gray-400">{Math.round(progress)}%</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFDF7] pb-24">
            {/* Sticky Header Bar */}
            <header className="bg-white border-b border-[#E6E6E6] sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 transition-colors">← Retour</button>
                </div>
            </header>

            {/* Title Input Section - Below Header */}
            <div className="bg-white border-b border-gray-100 py-6">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="max-w-2xl mx-auto relative">
                        <label className="block text-center text-xs font-bold text-orange-600 mb-2 uppercase tracking-wider">
                            📝 Titre de l'histoire (modifiable)
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={book?.story_content?.title || ""}
                                onChange={(e) => {
                                    const newTitle = e.target.value;
                                    setBook(prev => ({
                                        ...prev,
                                        story_content: { ...prev.story_content, title: newTitle }
                                    }));
                                }}
                                className="w-full text-center font-chewy text-3xl text-orange-900 border-2 border-orange-200 hover:border-orange-400 focus:border-orange-500 bg-orange-50 focus:bg-white outline-none transition-all py-4 rounded-xl px-12 shadow-sm"
                                placeholder="Titre de l'histoire"
                            />
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                <FaPen className="text-orange-400 w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-2xl">💡</span>
                    <p className="text-sm text-blue-900">
                        👋 <strong>Relisez bien le texte !</strong> Vous pouvez le modifier pour qu'il soit parfait. Une fois validé, nous dessinerons les images.
                    </p>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
                {pages.map((page, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-[#F0F0F0] flex flex-col md:flex-row gap-6">

                        {/* Image Placeholder */}
                        <div className="w-full md:w-1/3 aspect-[4/3] bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                            <span className="text-2xl mb-2">🖼️</span>
                            <span className="text-xs text-center px-4">Image {page.page_number}</span>
                            <p className="text-[10px] mt-2 px-2 text-center opacity-60 line-clamp-3 hidden md:block">
                                {page.image_prompt}
                            </p>
                        </div>

                        {/* Text Editor */}
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                                Page {page.page_number}
                            </label>
                            <textarea
                                value={page.text}
                                onChange={(e) => handleTextChange(idx, e.target.value)}
                                className="w-full h-full min-h-[120px] p-4 text-lg font-medium text-[#333333] border border-transparent hover:border-gray-200 focus:border-[#FF5F6D] focus:ring-2 focus:ring-[#FF5F6D]/10 rounded-xl transition-all outline-none resize-none bg-transparent"
                            />
                        </div>
                    </div>
                ))}

                <div className="sticky bottom-20 z-30">
                    <button
                        onClick={handleGenerateImages}
                        className="w-full bg-[#FF5F6D] hover:bg-[#FF4A5C] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 text-lg"
                    >
                        <FaMagic />
                        Valider & Générer les Images
                    </button>
                </div>

            </main>

            <DashboardBottomNav />

            {/* SUCCESS MODAL */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"></div>
                    <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 text-center">
                        <div className="text-6xl mb-4 animate-bounce">🎉</div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Histoire Prête !</h2>
                        <p className="text-gray-500 mb-8">
                            Votre livre magique a été créé avec succès. Que voulez-vous faire ?
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => router.push(`/read/${bookId}`)}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                            >
                                <FaBookOpen />
                                Lire maintenant
                            </button>

                            <button
                                onClick={() => router.push('/dashboard/purchased')}
                                className="w-full bg-white border-2 border-gray-200 hover:border-orange-200 text-gray-600 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <FaList />
                                Voir ma bibliothèque
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
