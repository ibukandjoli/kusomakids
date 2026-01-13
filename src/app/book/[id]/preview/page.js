'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { fal } from '@fal-ai/client';
import BookReader from '@/app/components/BookReader';
import { STATIC_COVERS } from '@/lib/static-covers';

fal.config({
    proxyUrl: '/api/fal/proxy',
});

// Models
const MODEL_I2I = 'fal-ai/flux/dev/image-to-image';
const MODEL_T2I = 'fal-ai/flux/dev';

export default function PreviewPage() {
    const router = useRouter();
    const params = useParams();

    // States
    const [status, setStatus] = useState("init");
    const [progressMessage, setProgressMessage] = useState("Initialisation...");
    const [loadingTip, setLoadingTip] = useState("Savais-tu que le Baobab peut vivre 2000 ans ? 🌳");
    const [orderData, setOrderData] = useState(null);
    const [pages, setPages] = useState([]);

    // User State
    const [user, setUser] = useState(null);

    // Fun & Educational Loading Steps
    const loadingSteps = {
        init: { icon: "🪄", text: "Préparation de la formule magique..." },
        writing: { icon: "✍️", text: "L'écrivain imagine ton aventure..." },
        illustrating: { icon: "🎨", text: "Nos artistes peignent les illustrations..." },
    };

    // Loaded Content
    const [story, setStory] = useState(null);
    const [coverImage, setCoverImage] = useState(null); // New Cover State
    const hasStartedRef = useRef(false); // Prevent double firing

    useEffect(() => {
        const init = async () => {
            if (hasStartedRef.current) return;
            hasStartedRef.current = true;

            // 1. User Session
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user);

            // 2. Load Cart Data
            const storedOrder = localStorage.getItem('cart_item');
            if (!storedOrder) {
                console.error("❌ No cart_item found");
                router.push('/books');
                return;
            }
            const parsed = JSON.parse(storedOrder);
            setOrderData(parsed);

            // GUEST PERSISTENCE: Save to My Books
            try {
                const guestBooks = JSON.parse(localStorage.getItem('guest_books') || '[]');
                const existingIndex = guestBooks.findIndex(b => b.bookId === parsed.bookId);

                const bookEntry = {
                    ...parsed,
                    lastUpdated: new Date().toISOString(),
                    status: 'draft'
                };

                if (existingIndex >= 0) {
                    guestBooks[existingIndex] = bookEntry;
                } else {
                    guestBooks.push(bookEntry);
                }

                localStorage.setItem('guest_books', JSON.stringify(guestBooks));
                window.dispatchEvent(new Event('guest_books_updated')); // Notify Header
            } catch (e) {
                console.error("Guest Persistence Error:", e);
            }

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
                "💡 Le lion rugit si fort qu'on l'entend à 8 km !",
                "🦒 La girafe a une langue bleue de 50 cm !",
                "🐘 Les éléphants sont les seuls mammifères qui ne peuvent pas sauter.",
                "🎻 Le griot est le gardien des histoires en Afrique de l'Ouest.",
                "🦅 L'aigle royal peut voir un lapin à 3 km de distance.",
                "🎨 Chaque livre est unique, comme toi !",
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
            console.log("🚀 Starting Generation Flow");
            console.log("📦 Payload:", { childName: data.personalization.childName, theme: themeSlug });

            // 1. Generate Story Text (OpenAI)
            setStatus("writing");
            setProgressMessage(`Nos conteurs écrivent l'histoire de ${data.personalization.childName}...`);

            const storyRes = await fetch('/api/generate-story', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    childName: data.personalization.childName,
                    childAge: data.personalization.age || 5,
                    gender: data.personalization.gender === 'boy' ? 'Garçon' : 'Fille',
                    theme: themeSlug
                }),
            });

            const storyData = await storyRes.json();
            if (!storyRes.ok) {
                console.error("❌ API Error:", storyData);
                throw new Error(storyData.error || "Erreur story");
            }
            const generatedStory = storyData.story;

            // FIX: Validate Story Structure to prevent crash
            if (!generatedStory || !generatedStory.pages || !Array.isArray(generatedStory.pages)) {
                console.error("❌ Invalid Story Structure:", generatedStory);
                throw new Error("Format d'histoire invalide reçu du serveur.");
            }

            setStory(generatedStory);

            // 2. Generate Images (Fal AI)
            setStatus("illustrating");
            setProgressMessage("Création des illustrations magiques...");

            // --- COVER STRATEGY: STATIC TEMPLATE + FACE SWAP ---
            const hasPhoto = !!data.personalization?.photoUrl;
            let coverUrl = STATIC_COVERS[themeSlug] || STATIC_COVERS['default'];

            // FIX: Convert relative path to absolute URL for Fal.ai
            if (coverUrl.startsWith('/')) {
                coverUrl = `${window.location.origin}${coverUrl}`;
            }

            console.log(`🖼️ Generating Cover. Theme: ${themeSlug}, Base: ${coverUrl}`);

            // WARNING: Fal.ai cannot download images from localhost
            if (coverUrl.includes('localhost')) {
                console.warn("⚠️ FAL AI WARNING: Cannot Face Swap with local image. Image URL is localhost.");
            }

            if (hasPhoto) {
                setProgressMessage("Personnalisation de la couverture...");
                try {
                    const swapInput = {
                        base_image_url: coverUrl,
                        swap_image_url: data.personalization.photoUrl
                    };
                    const swapResult = await fal.subscribe("fal-ai/face-swap", {
                        input: swapInput,
                        logs: true,
                    });
                    const swapImages = swapResult.images || swapResult.data?.images;
                    if (Array.isArray(swapImages) && swapImages.length > 0) {
                        coverUrl = swapImages[0].url;
                        console.log("✅ Cover Face Swap Success:", coverUrl);
                    }
                } catch (e) {
                    console.error("Cover Swap Failed, using template:", e);
                }
            }
            setCoverImage(coverUrl);


            const pagesToGenerate = generatedStory.pages;
            const generatedPages = [];

            // Determine Model Strategy for Pages
            const MODEL_ID = hasPhoto ? MODEL_I2I : MODEL_T2I;
            console.log(`🎨 Using Model for Pages: ${MODEL_ID}`);

            for (let i = 0; i < pagesToGenerate.length; i++) {
                const page = pagesToGenerate[i];
                setProgressMessage(`Illustration de la page ${i + 1} / ${pagesToGenerate.length}...`);

                // Prepare Input
                // Prepare Input (Refactored)

                // --- PARTIAL GENERATION LOGIC (Cost Optimization) ---
                if (i >= 2) {
                    console.log(`⏩ Skipping AI for Page ${i + 1} (Preview Mode)`);
                    generatedPages.push({
                        id: i + 1,
                        text: page.text,
                        image: coverUrl || "/images/placeholders/blurred-preview.jpg"
                    });
                    setPages([...generatedPages]);
                    continue; // Skip generation
                }

                try {
                    // --- STEP 1: GENERATE SCENE (Text-to-Image) ---
                    let sceneUrl = null;

                    // ⚡️ COST OPTIMIZATION: Check for Cached Base Image
                    if (page.base_image_url) {
                        console.log(`⚡️ Using Cached Base Image for Page ${i + 1}`);
                        sceneUrl = page.base_image_url;

                        // FIX: Ensure absolute URL for Fal
                        if (sceneUrl.startsWith('/')) {
                            sceneUrl = `${window.location.origin}${sceneUrl}`;
                        }

                    } else {
                        // 💸 FALLBACK: Generate New Scene (Expensive)
                        console.log(`🖌️ Step 1: Generating Scene for Page ${i + 1}...`);

                        // CRITICAL: Inject Physical Attributes to prevent "Body Mismatch"
                        const physicalattributes = "cute little african girl, dark skin, braided hair";
                        const scenePrompt = `${physicalattributes}, ${page.imagePrompt || page.text}, pixar style, vibrant colors, masterpiece, best quality, wide shot, cinematic lighting`;

                        const sceneInput = {
                            prompt: scenePrompt,
                            image_size: "landscape_4_3", // Wide shot for immersion
                            num_inference_steps: 28,
                            guidance_scale: 3.5,
                            enable_safety_checker: false
                        };

                        const sceneResult = await fal.subscribe("fal-ai/flux/dev", {
                            input: sceneInput,
                            logs: true,
                        });

                        const sceneImages = sceneResult.images || sceneResult.data?.images;
                        if (Array.isArray(sceneImages) && sceneImages.length > 0) {
                            sceneUrl = sceneImages[0].url;
                        }

                        if (!sceneUrl) throw new Error("Scene Generation Failed");
                        console.log(`✅ Step 1 Success! Scene URL:`, sceneUrl);
                    }

                    // --- STEP 2: FACE SWAP (If Photo Exists) ---
                    let finalImageUrl = sceneUrl;

                    if (hasPhoto) {
                        console.log(`🎭 Step 2: Applying Face Swap...`);

                        // Corrected Parameters for fal-ai/face-swap (InsightFace)
                        const swapInput = {
                            base_image_url: sceneUrl, // Target (The Scene)
                            swap_image_url: data.personalization.photoUrl // Source (The Face)
                        };

                        // NOTE: If using 'fal-ai/face-swap' specifically, parameters are usually:
                        // base_image_url (target) AND swap_image_url (source)
                        // BUT let's log specifically to be sure we aren't missing something
                        console.log("🔍 Fal Face Swap Input:", JSON.stringify(swapInput, null, 2));

                        const swapResult = await fal.subscribe("fal-ai/face-swap", {
                            input: swapInput,
                            logs: true,
                        });

                        const swapImages = swapResult.images || swapResult.data?.images;
                        if (Array.isArray(swapImages) && swapImages.length > 0) {
                            finalImageUrl = swapImages[0].url;
                            console.log(`✅ Step 2 Success! Face Swapped.`);
                        } else {
                            console.warn("⚠️ Face Swap returned no image, using scene.");
                        }
                    }

                    generatedPages.push({
                        id: i + 1,
                        text: page.text,
                        image: finalImageUrl
                    });
                    setPages([...generatedPages]);

                } catch (err) {
                    console.error(`❌ Page ${i + 1} Failed:`, err);
                    if (err.body) {
                        try { console.error("❌ Error Body:", await err.body.text()); } catch (e) { }
                    }
                    generatedPages.push({ id: i + 1, text: page.text, image: null });
                    setPages([...generatedPages]);
                }
            }

            setStatus("complete");

        } catch (error) {
            console.error("🚨 CRITICAL Generation Error:", error);
            alert(`Une erreur est survenue: ${error.message}`);
        }
    };

    // Navigation and Handlers
    const handleEditSave = (pageId, newText) => {
        setPages(pages.map(p => p.id === pageId ? { ...p, text: newText } : p));
    };

    const handleConfirm = () => {
        const updatedOrder = { ...orderData, finalizedPages: pages };
        localStorage.setItem('cart_item', JSON.stringify(updatedOrder));
        router.push('/checkout');
    };

    const handleRead = () => {
        alert("Mode Lecture lancé !");
    };

    const handleUnlock = () => {
        router.push(`/signup?plan=club&redirect_book_id=${orderData?.bookId}`);
    };

    if (status !== "complete") {
        const currentStep = loadingSteps[status] || loadingSteps.init;

        return (
            <div className="fixed inset-0 z-50 bg-orange-50 flex flex-col items-center justify-center text-gray-900 px-4 font-serif">
                <div className="w-48 h-48 relative mb-8 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-orange-200 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute inset-4 border-4 border-orange-500 rounded-full animate-spin border-t-transparent"></div>
                    <span className="text-6xl animate-bounce filter drop-shadow-lg">{currentStep.icon}</span>
                </div>
                <h2 className="text-4xl font-bold mb-6 text-center text-gray-900 leading-tight">
                    {currentStep.text}
                </h2>
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl max-w-lg w-full border border-orange-100 transform transition-all hover:scale-105 duration-500">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest text-center mb-2">Pendant que tu patientes...</p>
                    <p className="text-xl text-center text-orange-600 font-medium italic">"{loadingTip}"</p>
                </div>
                <div className="w-64 md:w-96 h-3 bg-gray-200 rounded-full mt-10 overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-700 ease-out"
                        style={{
                            width: status === 'writing' ? '30%'
                                : status === 'illustrating' && pages.length === 0 ? '50%'
                                    : status === 'illustrating' && pages.length === 1 ? '65%'
                                        : status === 'illustrating' && pages.length === 2 ? '80%'
                                            : status === 'illustrating' && pages.length === 3 ? '95%'
                                                : '10%'
                        }}
                    ></div>
                </div>
                <p className="mt-2 text-xs text-gray-400 font-mono">Magie en cours... ne quitte pas !</p>
            </div>
        );
    }

    // FULL SCREEN LAYOUT
    return (
        // Main Container: Fixed Full Screen, below Navbar (assumed 80px)
        <div className="fixed inset-0 top-[80px] bottom-[0px] z-0 flex flex-col bg-[#FDFBF7]">

            {/* BACK & TITLE HEADER (Mobile Safe) */}
            <div className="flex-none p-4 flex items-center justify-between bg-white/50 backdrop-blur-sm border-b border-orange-100 z-20">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m12 19-7-7 7-7" />
                        <path d="M19 12H5" />
                    </svg>
                    <span className="hidden md:inline font-bold">Retour</span>
                </button>
                <div className="text-center">
                    <h1 className="text-lg md:text-2xl font-black text-gray-900 font-serif leading-none truncate max-w-[200px] md:max-w-none">{orderData?.bookTitle}</h1>
                    <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Pour {orderData?.personalization?.childName}</p>
                </div>
                <div className="w-10 md:w-20"></div> {/* Spacer */}
            </div>

            {/* MAIN CONTENT AREA - NO PADDING, FULL GROW */}
            <div className="flex-grow w-full relative overflow-hidden">
                <BookReader
                    book={{
                        // Priority to Template Title (orderData.bookTitle) to ensure persistence
                        title: orderData?.bookTitle || story?.title,
                        child_name: orderData?.personalization?.childName,
                        cover_url: coverImage, // Use the generated/swapped cover
                        is_unlocked: false
                    }}
                    extraPages={pages}
                    isEditable={true}
                    onTextChange={(index, newText) => {
                        const pageId = pages[index]?.id;
                        if (pageId) handleEditSave(pageId, newText);
                    }}
                    onUnlock={handleUnlock}
                />
            </div>

            {/* BOTTOM BAR (CTA) - Dynamic Layout for Mobile */}
            <div className="flex-none bg-white p-4 border-t border-gray-200 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-left hidden md:block">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <span className="bg-orange-100 text-orange-600 p-1 rounded">✏️</span> Mode Édition
                        </h3>
                        <p className="text-gray-500 text-xs">Cliquez sur le texte pour le modifier.</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                        {user ? (
                            <button
                                onClick={handleRead}
                                className="w-full md:w-auto bg-orange-500 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-orange-600 transition-all shadow-xl flex items-center justify-center gap-2"
                            >
                                <span>📖</span> Lire l'histoire
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => router.push(`/signup?plan=club&redirect_book_id=${orderData?.bookId}`)}
                                    className="w-full md:w-auto text-orange-600 border-2 border-orange-100 bg-orange-50 px-6 py-3 rounded-full font-bold hover:bg-orange-100 transition-colors order-2 md:order-1"
                                >
                                    Rejoindre le Club
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="w-full md:w-auto bg-green-600 text-white px-6 py-3 rounded-full font-bold text-lg hover:bg-green-700 transition-all shadow-xl flex items-center justify-center gap-3 order-1 md:order-2"
                                >
                                    Acheter <span className="bg-white/20 px-2 py-1 rounded text-sm text-green-100 whitespace-nowrap">3000 FCFA</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
