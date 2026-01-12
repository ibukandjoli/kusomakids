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
        // Load data from localStorage
        const storedOrder = localStorage.getItem('cart_item');
        if (!storedOrder) {
            router.push('/books');
            return;
        }
        const parsed = JSON.parse(storedOrder);
        setOrderData(parsed);

        startGeneration(parsed);

        // Rotating Tips
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
    }, [router]);

    const startGeneration = async (data) => {
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
                    theme: 'Aventure Magique' // Ideally should come from book metadata or route
                }),
            });

            const storyData = await storyRes.json();
            if (!storyRes.ok) throw new Error(storyData.error || "Erreur story");

            const generatedStory = storyData.story;
            setStory(generatedStory);

            // 2. Generate Images (Fal AI)
            setStatus("illustrating");
            setProgressMessage("Création des illustrations magiques...");

            // Limit to 3 pages for preview
            const previewPages = generatedStory.pages.slice(0, 3);
            const generatedPages = [];

            for (let i = 0; i < previewPages.length; i++) {
                const page = previewPages[i];
                setProgressMessage(`Illustration de la page ${i + 1} / 3...`);

                // Prepare Input safely
                const falInput = {
                    prompt: `${page.imagePrompt}, pixar style, cute, vibrant colors`,
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

                    let imageUrl = '/images/books/soso-etoiles/page1.png'; // Fallback
                    if (result.images && result.images.length > 0) {
                        imageUrl = result.images[0].url;
                    } else if (result.image) {
                        imageUrl = result.image.url;
                    }

                    generatedPages.push({
                        id: i + 1,
                        text: page.text,
                        image: imageUrl
                    });

                    setPages([...generatedPages]);

                } catch (err) {
                    console.error("Fal Generation Error:", err);
                    generatedPages.push({
                        id: i + 1,
                        text: page.text,
                        image: '/images/books/soso-etoiles/page1.png'
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
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
            setUser(session?.user);
        }
        checkUser();
    }, []);

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

        if (user) {
            router.push('/checkout');
        } else {
            router.push('/checkout');
        }
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
        <div className="min-h-screen bg-orange-50 pt-24 pb-8 flex flex-col">
            <div className="flex-grow flex flex-col w-full h-full px-4 md:px-8">

                <div className="text-center mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Voici votre histoire !</h1>
                    <p className="text-gray-600 text-sm">
                        Découvrez les 3 premières pages générées pour {orderData?.personalization?.childName}.
                    </p>
                </div>

                {/* --- BOOK READER (Interactive & Editable) --- */}
                <div className="flex-grow flex items-center justify-center w-full mb-8 relative">
                    <div className="w-full h-full max-h-[75vh] max-w-[1600px] mx-auto">
                        <BookReader
                            book={{
                                title: story?.title || `L'aventure de ${orderData?.personalization?.childName}`,
                                child_name: orderData?.personalization?.childName,
                                cover_url: pages[0]?.image || null,
                                is_unlocked: true
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

                <div className="bg-white p-4 md:p-6 rounded-3xl shadow-xl border-t-4 border-orange-500 text-center animate-in fade-in duration-700 delay-500 max-w-5xl mx-auto w-full sticky bottom-4 z-40">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-left">
                            <h3 className="font-bold text-gray-900">Satisfait du résultat ?</h3>
                            <p className="text-gray-500 text-sm">Ceci n'est qu'un aperçu basse résolution.</p>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right hidden md:block">
                                <span className="block text-xs text-gray-500">Total à payer</span>
                                <span className="block text-2xl font-bold text-gray-900">3.000 F CFA</span>
                            </div>
                            <button
                                onClick={handleConfirm}
                                className="bg-green-600 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-green-700 transition-all shadow-xl hover:shadow-green-600/30 transform hover:-translate-y-1 flex items-center gap-3"
                            >
                                Valider et Commander <span className="bg-white/20 px-2 py-1 rounded text-sm">💳</span>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
