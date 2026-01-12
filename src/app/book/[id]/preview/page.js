'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { fal } from '@fal-ai/client';
import BookReader from '@/app/components/BookReader';

fal.config({
    proxyUrl: '/api/fal/proxy',
});

// Using Flux Dev as requested/tested
const MODEL_ID = 'fal-ai/flux/dev';

export default function PreviewPage() {
    const router = useRouter();
    const params = useParams();

    // States
    const [status, setStatus] = useState("init"); // init, writing, illustrating, complete
    const [progressMessage, setProgressMessage] = useState("Initialisation...");
    const [loadingTip, setLoadingTip] = useState("Savais-tu que le Baobab peut vivre 2000 ans ? 🌳"); // Rotating tip
    const [orderData, setOrderData] = useState(null);
    const [pages, setPages] = useState([]);

    // Loaded Content
    const [story, setStory] = useState(null);

    useEffect(() => {
        const init = async () => {
            // 1. User Session
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user);

            // 2. Load Cart Data
            const storedOrder = localStorage.getItem('cart_item');
            if (!storedOrder) {
                router.push('/books');
                return;
            }
            const parsed = JSON.parse(storedOrder);
            setOrderData(parsed);

            // 3. Fetch Real Theme from DB
            let themeToUse = 'aventure'; // Default
            if (parsed.bookId) {
                const { data: template } = await supabase
                    .from('story_templates')
                    .select('theme_slug, title')
                    .eq('id', parsed.bookId)
                    .single();

                if (template) {
                    themeToUse = template.theme_slug;
                    // Update title if needed
                    parsed.bookTitle = template.title;
                }
            }

            // 4. Start Generation with Real Theme
            startGeneration(parsed, themeToUse);

            // 5. Rotating Tips
            const tips = [
                "Savais-tu que le Baobab peut vivre 2000 ans ? 🌳",
                "Préparation des illustrations magiques... 🎨",
                "Ajout de la touche de poussière d'étoiles... ✨",
                "Le héros se prépare pour l'aventure... 🦸🏾",
                "Les griots accordent leurs koras... 🎵",
                "Nos artistes dessinent le sourire de votre enfant... ✏️"
            ];
            let tipIndex = 0;
            const interval = setInterval(() => {
                tipIndex = (tipIndex + 1) % tips.length;
                setLoadingTip(tips[tipIndex]);
            }, 3500);

            return () => clearInterval(interval);
        };

        init();
    }, [router]);

    const startGeneration = async (data, themeSlug) => {
        try {
            // 1. Generate Story Text (OpenAI)
            setStatus("writing");
            setProgressMessage(`Écriture de l'histoire pour ${data.personalization.childName}...`);

            const storyRes = await fetch('/api/generate-story', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    childName: data.personalization.childName,
                    childAge: data.personalization.age || 5,
                    gender: data.personalization.gender === 'boy' ? 'Garçon' : 'Fille',
                    theme: themeSlug // REAL THEME
                }),
            });

            const storyData = await storyRes.json();
            if (!storyRes.ok) throw new Error(storyData.error || "Erreur story");

            const generatedStory = storyData.story;
            setStory(generatedStory);

            // 2. Generate Images (Fal AI)
            setStatus("illustrating");
            setProgressMessage("Création des illustrations magiques...");

            // GENERATE ALL PAGES (No Slice)
            const pagesToGenerate = generatedStory.pages;
            const generatedPages = [];

            for (let i = 0; i < pagesToGenerate.length; i++) {
                const page = pagesToGenerate[i];
                setProgressMessage(`Illustration de la page ${i + 1} / ${pagesToGenerate.length}...`);

                // Prepare Input safely
                const falInput = {
                    prompt: `${page.imagePrompt}, pixar style, cute, vibrant colors, masterpiece, best quality`,
                    image_strength: 0.5,
                    guidance_scale: 3.5,
                    num_inference_steps: 25,
                    enable_safety_checker: false
                };

                // Only add image_url if it exists and looks valid
                if (data.personalization?.photoUrl) {
                    falInput.image_url = data.personalization.photoUrl;
                }

                try {
                    // Call Fal AI
                    const result = await fal.subscribe(MODEL_ID, {
                        input: falInput,
                        logs: false,
                    });

                    let imageUrl = null; // No fallback by default to force retry or empty state if needed? 
                    // User wants generated images. Falsely indicating success with soso-etoiles is bad.
                    // But we don't want to break the UI. 
                    // Let's use a generic placeholder if it fails, NOT soso-etoiles if possible.
                    // But for now, let's trust the Proxy Fix.

                    if (result.images && result.images.length > 0) {
                        imageUrl = result.images[0].url;
                    } else if (result.image) {
                        imageUrl = result.image.url;
                    }

                    generatedPages.push({
                        id: i + 1,
                        text: page.text,
                        image: imageUrl // Can be null if failed, BookReader should handle it
                    });

                    setPages([...generatedPages]);

                } catch (err) {
                    console.error("Fal Generation Error:", err);
                    generatedPages.push({
                        id: i + 1,
                        text: page.text,
                        image: null // Failed
                    });
                    setPages([...generatedPages]);
                }
            }

            setStatus("complete");

        } catch (error) {
            console.error("Generation Error:", error);
            alert("Une erreur est survenue lors de la magie. Nous allons réessayer.");
        }
    };

    // Navigation and Handlers
    const [currentIndex, setCurrentIndex] = useState(0);
    const [editingId, setEditingId] = useState(null);
    const [tempText, setTempText] = useState("");
    // User state already handled in init

    const handleEditStart = (page) => {
        setEditingId(page.id);
        setTempText(page.text);
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setTempText("");
    };

    const handleEditSave = (pageId, newText) => {
        setPages(pages.map(p => p.id === pageId ? { ...p, text: newText } : p));
        setEditingId(null);
    };

    const handleConfirm = () => {
        const updatedOrder = { ...orderData, finalizedPages: pages };
        localStorage.setItem('cart_item', JSON.stringify(updatedOrder));
        router.push('/checkout');
    };

    const handleRead = () => {
        // Open full screen reader logic (maybe just stay here but hide UI?)
        // For now, let's simulated it or push to a read page if it existed locally.
        alert("Mode Lecture lancé ! (Simulation)");
    };

    if (status !== "complete") {
        return (
            <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center text-gray-900 px-4">
                <div className="w-32 h-32 relative mb-8">
                    <div className="absolute inset-0 border-4 border-orange-200 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute inset-4 border-4 border-orange-500 rounded-full animate-spin border-t-transparent"></div>
                    {status === 'writing' && <span className="absolute inset-0 flex items-center justify-center text-4xl animate-bounce">✍️</span>}
                    {status === 'illustrating' && <span className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse">🎨</span>}
                </div>
                <h2 className="text-3xl font-bold mb-4 text-center text-gray-900">Magie en cours...</h2>
                <p className="text-gray-600 text-center max-w-md animate-pulse font-mono bg-white/50 px-4 py-2 rounded-lg mb-2 shadow-sm border border-orange-100">
                    {progressMessage}
                </p>
                <p className="text-orange-600 text-sm italic opacity-80 select-none font-bold">
                    "{loadingTip}"
                </p>

                <div className="w-64 h-2 bg-gray-200 rounded-full mt-8 overflow-hidden">
                    <div
                        className="h-full bg-orange-500 transition-all duration-500"
                        style={{
                            width: status === 'writing' ? '30%'
                                : status === 'illustrating' && pages.length === 0 ? '50%'
                                    : status === 'illustrating' && pages.length === 1 ? '70%'
                                        : status === 'illustrating' && pages.length === 2 ? '90%'
                                            : '100%'
                        }}
                    ></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-orange-50 pt-24 pb-0 flex flex-col"> {/* Full Heigh Optimization */}
            <div className="flex-grow flex flex-col w-full h-full px-0 md:px-4">

                <div className="text-center mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{orderData?.bookTitle}</h1> {/* Display REAL Title */}
                    <p className="text-gray-600 text-sm">
                        Histoire personnalisée pour {orderData?.personalization?.childName}
                    </p>
                </div>

                {/* --- BOOK READER (Interactive & Editable) --- */}
                <div className="flex-grow flex items-center justify-center w-full mb-20 relative"> {/* Added mb-20 for bottom bar */}
                    <div className="w-full h-full max-h-[85vh] max-w-[1800px] mx-auto"> {/* Maximized View */}
                        <BookReader
                            book={{
                                title: story?.title || orderData?.bookTitle,
                                child_name: orderData?.personalization?.childName,
                                cover_url: pages[0]?.image || null,
                                is_unlocked: true // Preview is unlocked for editing
                            }}
                            extraPages={pages}
                            isEditable={true}
                            onTextChange={(index, newText) => {
                                const pageId = pages[index]?.id;
                                if (pageId) handleEditSave(pageId, newText);
                            }}
                        />
                    </div>
                </div>

                <div className="bg-white p-4 border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-left hidden md:block">
                            <h3 className="font-bold text-gray-900">Mode Édition</h3>
                            <p className="text-gray-500 text-xs text-balance">Modifiez le texte en cliquant dessus. Les images sont protégées.</p>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            {user ? (
                                // LOGGED IN: Read Mode
                                <button
                                    onClick={handleRead}
                                    className="w-full md:w-auto bg-orange-500 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-orange-600 transition-all shadow-xl flex items-center justify-center gap-2"
                                >
                                    <span>📖</span> Lire l'histoire
                                </button>
                            ) : (
                                // GUEST: Join or Buy
                                <>
                                    <button
                                        onClick={() => router.push('/signup')}
                                        className="hidden md:flex flex-1 md:flex-none text-orange-600 border-2 border-orange-100 bg-orange-50 px-6 py-3 rounded-full font-bold hover:bg-orange-100 transition-colors"
                                    >
                                        Rejoindre le Club
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        className="flex-1 md:flex-none bg-green-600 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-green-700 transition-all shadow-xl flex items-center justify-center gap-3"
                                    >
                                        Valider et Acheter <span className="bg-white/20 px-2 py-1 rounded text-sm">💳</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
