'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { fal } from '@fal-ai/client';

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

                // Call Fal AI
                const result = await fal.subscribe(MODEL_ID, {
                    input: {
                        prompt: `${page.imagePrompt}, pixar style, cute, vibrant colors`,
                        image_url: data.personalization.photoUrl,
                        image_strength: 0.5,
                        guidance_scale: 3.5,
                        num_inference_steps: 25,
                        enable_safety_checker: false
                    },
                    logs: false,
                });

                let imageUrl = '/images/books/page1-placeholder.png'; // Fallback
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

                // Update state progressively to show images arriving
                setPages([...generatedPages]);
            }

            setStatus("complete");

        } catch (error) {
            console.error("Generation Error:", error);
            alert("Une erreur est survenue lors de la magie. Nous allons réessayer.");
            // Potentially redirect or retry
        }
    };

    const handleTextChange = (id, newText) => {
        setPages(pages.map(p => p.id === id ? { ...p, text: newText } : p));
    };

    const handleConfirm = () => {
        // Save finalized text/images to cart?
        // For now, we assume the checkout flow will just capture the initial intent + personalization
        // In a real app, we would update the 'cart_item' with the finalized 'pages' data
        const updatedOrder = { ...orderData, finalizedPages: pages };
        localStorage.setItem('cart_item', JSON.stringify(updatedOrder));
        router.push('/checkout');
    };

    if (status !== "complete") {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white px-4">
                <div className="w-32 h-32 relative mb-8">
                    <div className="absolute inset-0 border-4 border-orange-500 rounded-full animate-ping opacity-25"></div>
                    <div className="absolute inset-4 border-4 border-orange-500 rounded-full animate-spin border-t-transparent"></div>
                    {status === 'writing' && <span className="absolute inset-0 flex items-center justify-center text-4xl animate-bounce">✍️</span>}
                    {status === 'illustrating' && <span className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse">🎨</span>}
                </div>
                <h2 className="text-3xl font-bold mb-4 text-center">Magie en cours...</h2>
                <p className="text-gray-400 text-center max-w-md animate-pulse font-mono bg-gray-800 px-4 py-2 rounded-lg">
                    {progressMessage}
                </p>

                {/* Progress Bar */}
                <div className="w-64 h-2 bg-gray-800 rounded-full mt-8 overflow-hidden">
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
        <div className="min-h-screen bg-orange-50 pt-32 pb-20">
            <div className="container mx-auto px-4 max-w-4xl">

                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Voici votre histoire !</h1>
                    <p className="text-gray-600">
                        Découvrez les 3 premières pages générées spécialement pour {orderData?.personalization?.childName}.
                    </p>
                </div>

                <div className="space-y-12">
                    {pages.map((page, index) => (
                        <div key={page.id} className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-orange-100 flex flex-col md:flex-row gap-8 items-center animate-in zoom-in duration-500 delay-100">

                            {/* Page Number */}
                            <div className="absolute -left-4 -top-4 w-12 h-12 bg-orange-500 text-white font-bold rounded-full flex items-center justify-center shadow-lg transform -translate-y-1/2">
                                {index + 1}
                            </div>

                            {/* Image (Left) */}
                            <div className="w-full md:w-1/3 aspect-square bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 relative overflow-hidden shadow-inner group">
                                <Image
                                    src={page.image}
                                    alt={`Page ${index + 1}`}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl"></div>
                            </div>

                            {/* Editable Text (Right) */}
                            <div className="w-full md:w-2/3">
                                <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide flex justify-between">
                                    <span>Texte de la page {index + 1}</span>
                                    <span className="text-xs text-orange-500 font-normal">✏️ Modifiable</span>
                                </label>
                                <textarea
                                    value={page.text}
                                    onChange={(e) => handleTextChange(page.id, e.target.value)}
                                    rows={5}
                                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all font-serif text-lg leading-relaxed text-gray-800 bg-orange-50/30 resize-none shadow-inner"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 bg-white p-8 rounded-3xl shadow-xl border-t-4 border-orange-500 text-center animate-in fade-in duration-700 delay-500">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Satisfait du résultat ?</h3>
                    <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                        Ceci n'est qu'un aperçu avec des images basse résolution. Le livre final contiendra toutes les pages en haute définition.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                        <div className="text-left">
                            <span className="block text-sm text-gray-500">Total à payer</span>
                            <span className="block text-4xl font-bold text-gray-900">3.000 F CFA</span>
                        </div>
                        <button
                            onClick={handleConfirm}
                            className="bg-green-600 text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-green-700 transition-all shadow-xl hover:shadow-green-600/30 transform hover:-translate-y-1 flex items-center gap-3"
                        >
                            Valider et Commander <span className="bg-white/20 px-2 py-1 rounded text-sm">💳</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
