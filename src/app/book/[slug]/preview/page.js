'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { fal } from '@fal-ai/client';
import BookReader from '@/app/components/BookReader';
import { STATIC_COVERS } from '@/lib/static-covers';
import { formatTitle } from '@/utils/format';

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
    const [savedBookId, setSavedBookId] = useState(null); // DB Persistence
    const hasStartedRef = useRef(false); // Prevent double firing
    const statusRef = useRef(status); // Track status for intervals

    useEffect(() => { statusRef.current = status; }, [status]);

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

            // PRE-SET COVER if available in cart
            if (parsed.coverUrl) {
                setCoverImage(parsed.coverUrl);
            }

            // 4. Start Generation with Real Theme
            startGeneration(parsed, themeToUse);

            // 5. Timed Magic Messages & Progress
            const steps = [
                { t: 0, text: `🔍 Analyse de la photo de ${parsed.personalization?.childName || 'ton enfant'}...`, icon: "🔍", progress: 10 },
                { t: 10, text: "✨ Préparation de la poudre magique...", icon: "✨", progress: 30 },
                { t: 25, text: "🎨 Les artistes peignent la couverture...", icon: "🎨", progress: 60 },
                { t: 40, text: "📚 Assemblage du livre... C'est presque prêt !", icon: "📚", progress: 90 }
            ];

            const startTime = Date.now();
            const timerInterval = setInterval(() => {
                if (statusRef.current === 'complete') return; // STOP if complete

                const elapsedSec = (Date.now() - startTime) / 1000;

                // Find current step
                const currentStep = steps.slice().reverse().find(s => elapsedSec >= s.t) || steps[0];

                setProgressMessage(currentStep.text);
            }, 1000);

            // 5. Rotating Tips (Keep existing)
            const tips = [
                "💡 Le lion rugit si fort qu'on l'entend à 8 km !",
                "🦒 La girafe a une langue bleue de 50 cm !",
                "🐘 Les éléphants sont les seuls mammifères qui ne peuvent pas sauter.",
                "🎻 Le griot est le gardien des histoires en Afrique de l'Ouest.",
                "🦅 L'aigle royal peut voir un lapin à 3 km de distance.",
                "🎨 Chaque livre est unique, comme toi !",
            ];
            let tipIndex = 0;
            const tipInterval = setInterval(() => {
                if (statusRef.current === 'complete') return; // STOP if complete

                tipIndex = (tipIndex + 1) % tips.length;
                setLoadingTip(tips[tipIndex]);
            }, 3500);

            return () => {
                clearInterval(timerInterval);
                clearInterval(tipInterval);
            };
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

            // PRIORITY 1: Authenticated/Database Template URL (Supabase) - Accessible by Fal AI
            // PRIORITY 2: Static Local Fallback (Dev/Offline)
            // PRIORITY 1: Authenticated/Database Template URL
            // PRIORITY 2: Static Local Fallback
            let coverUrl = data.coverUrl || STATIC_COVERS[themeSlug] || STATIC_COVERS['default'];

            console.log(`🖼️ Base Cover URL: ${coverUrl}`);

            // Prepare Absolute URL for Fal (but don't overwrite display URL yet)
            let falBaseUrl = coverUrl;
            if (falBaseUrl && falBaseUrl.startsWith('/')) {
                falBaseUrl = `${window.location.origin}${falBaseUrl}`;
            }

            // WARNING: Fal.ai cannot download images from localhost
            if (falBaseUrl && falBaseUrl.includes('localhost')) {
                console.warn("⚠️ FAL AI WARNING: Cannot Face Swap with local image on localhost.");
            }

            if (hasPhoto) {
                setProgressMessage("Personnalisation de la couverture...");
                try {
                    console.log("🎭 Swapping Cover Face...");
                    const swapInput = {
                        base_image_url: falBaseUrl,
                        swap_image_url: data.personalization.photoUrl
                    };

                    const swapResult = await fal.subscribe("fal-ai/face-swap", {
                        input: swapInput,
                        logs: true,
                    });

                    // DEBUG: Log Full Result
                    console.log("🔍 Full Face Swap Result:", JSON.stringify(swapResult, null, 2));

                    // Handle various Fal response formats (Arrays or Single Object)
                    // Handle various Fal response formats (Arrays or Single Object)
                    const swapUrl = swapResult.image?.url || swapResult.images?.[0]?.url || swapResult.data?.image?.url || swapResult.data?.images?.[0]?.url;

                    if (swapUrl) {
                        const newCover = swapUrl;
                        console.log("✅ Cover Face Swap Success:", newCover);
                        coverUrl = newCover; // ONLY update if success
                    } else {
                        console.warn("⚠️ Cover Face Swap returned no images. Result:", swapResult);
                    }
                } catch (e) {
                    console.error("❌ Cover Swap Failed, using template:", e);
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
                        console.log(`⚡️ Using Cached Base Image for Page ${i + 1}: ${page.base_image_url}`);
                        // DEBUG: To helper user verify source
                        if (page.base_image_url.includes('supabase')) {
                            console.log("✅ GOOD: Using Supabase Storage for Page " + (i + 1));
                        } else {
                            console.warn("⚠️ WARNING: Using Local/External Path for Page " + (i + 1));
                        }

                        sceneUrl = page.base_image_url;

                        // FIX: Ensure absolute URL for Fal
                        if (sceneUrl.startsWith('/')) {
                            sceneUrl = `${window.location.origin}${sceneUrl}`;
                        }

                    } else {
                        // 💸 FALLBACK: Generate New Scene (Expensive)
                        console.log(`🖌️ Step 1: Generating Scene for Page ${i + 1}...`);

                        // CRITICAL: DYNAMIC PROMPT ENGINEERING (Resemblance & Composition)
                        const pGender = data.personalization.gender === 'girl' ? 'girl' : 'boy';
                        const pSkin = 'dark skin'; // Brand DNA
                        const pHair = data.personalization.gender === 'girl' ? 'braided hair' : 'short hair';

                        // "looking at camera, detailed face" helps Face Swap
                        // Added "middle shot" to ensure face is big enough for swap
                        // V1.5.3: Added specific features for better resemblance (beads, braids)
                        const pGenderTraits = data.personalization.gender === 'girl' ? 'cornrows, colorful beads, detailed african features' : '';
                        const physicalAttributes = `cute little african ${pGender}, ${pSkin}, ${pHair}, ${pGenderTraits}, detailed face, looking at camera, middle shot`;

                        // "wide shot" removed from physical to allow scene variety, but kept in Composition
                        const composition = "centered composition, detailed background, cinematic lighting, 8k";

                        const scenePrompt = `${physicalAttributes}, ${page.imagePrompt || page.text}, ${composition}, pixar style, 3d render, high fidelity, masterpiece, best quality, vibrant colors`;

                        console.log(`🎨 Prompting Page ${i + 1}: ${scenePrompt}`);

                        const sceneInput = {
                            prompt: scenePrompt,
                            image_size: "landscape_4_3", // Wide shot for immersion
                            num_inference_steps: 30, // Increased for better quality
                            guidance_scale: 3.5,
                            enable_safety_checker: false
                        };

                        // Use the correct model ID (T2I for scene generation)
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

                        // DEBUG: Log Full Result
                        // DEBUG: Log Full Result
                        console.log("🔍 Page Face Swap Result:", JSON.stringify(swapResult, null, 2));

                        const swapUrl = swapResult.image?.url || swapResult.images?.[0]?.url || swapResult.data?.image?.url || swapResult.data?.images?.[0]?.url;

                        if (swapUrl) {
                            finalImageUrl = swapUrl;
                            console.log(`✅ Step 2 Success! Face Swapped.`);
                        } else {
                            console.warn("⚠️ Face Swap returned no image, using scene. Result:", swapResult);
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

            // 3. AUTO-SAVE TO DB (If Logged In)
            // This ensures the book appears in the Dashboard immediately as a Draft
            if (user && user.id) {
                console.log("💾 Auto-saving Draft to Database...");
                try {
                    const saveRes = await fetch('/api/books/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: data.bookTitle, // Use formatted title?
                            childName: data.personalization.childName,
                            childAge: data.personalization.age,
                            childGender: data.personalization.gender,
                            childPhotoUrl: data.personalization.photoUrl,
                            content_json: pagesToGenerate.map((p, idx) => generatedPages[idx] || { text: p.text, image: null }), // Ensure we save the generated state
                            coverUrl: coverUrl, // The swapped cover
                            templateId: data.bookId // The template ID
                        })
                    });

                    const saveData = await saveRes.json();
                    if (saveRes.ok) {
                        console.log("✅ Draft Saved to DB:", saveData.bookId);
                        setSavedBookId(saveData.bookId);

                        // Optional: Update URL to point to real ID? 
                        // For now, keep as is.

                    } else {
                        console.error("❌ Failed to auto-save draft:", saveData);
                    }
                } catch (saveError) {
                    console.error("❌ Auto-save Error:", saveError);
                }
            }

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
        // FIX: Persist the Swapped Cover Image (coverImage state) instead of the initial orderData.coverUrl
        const updatedOrder = {
            ...orderData,
            coverUrl: coverImage || orderData.coverUrl, // Use state first 
            finalizedPages: pages,
            cartId: Date.now(),
            generatedBookId: savedBookId // PASS THE SAVED ID
        };

        // Retrieve existing cart
        let currentCart = [];
        try {
            currentCart = JSON.parse(localStorage.getItem('cart_items') || '[]');
            if (!Array.isArray(currentCart)) currentCart = [];
        } catch (e) {
            currentCart = [];
        }

        // Check if item validation/deduplication needed?
        // For now, simply append.
        currentCart.push(updatedOrder);

        localStorage.setItem('cart_items', JSON.stringify(currentCart));

        // Force update for Header
        window.dispatchEvent(new Event('cart_updated'));

        router.push('/checkout');
    };

    const handleRead = () => {
        alert("Mode Lecture lancé !");
    };

    const handleUnlock = () => {
        router.push(`/signup?plan=club&redirect_book_id=${orderData?.bookId}`);
    };

    // PAYWALL LOGIC: Only Active Subscribers can read freely during Draft mode.
    // Others must buy or join.
    // NOTE: In 'Preview' mode, the book is usually a Draft.
    // If it was already purchased, we probably wouldn't be in this creation flow (or we'd check status).
    // Assuming this page is for Creation/Draft only.
    const isSubscriber = user?.subscription_status === 'active';
    const showReadButton = isSubscriber;

    if (status !== "complete") {
        const currentStep = loadingSteps[status] || loadingSteps.init;

        return (
            <div className="fixed inset-0 z-50 bg-[#FDFBF7] flex flex-col items-center justify-center text-gray-900 px-4 font-sans">
                <div className="w-48 h-48 relative mb-8 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-orange-200 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute inset-4 border-4 border-orange-500 rounded-full animate-spin border-t-transparent"></div>
                    {/* We can use a generic magic icon here since text changes */}
                    <span className="text-6xl animate-bounce filter drop-shadow-lg">✨</span>
                </div>

                <h2 className="text-2xl md:text-3xl font-black mb-6 text-center text-gray-900 leading-tight max-w-lg animate-pulse">
                    {progressMessage}
                </h2>

                <div className="bg-white p-6 rounded-2xl shadow-xl max-w-lg w-full border border-orange-100 transform transition-all hover:scale-105 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                        <motion.div
                            className="h-full bg-orange-500"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 45, ease: "linear" }}
                        />
                    </div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest text-center mb-3">Pendant que tu patientes...</p>
                    <p className="text-lg text-center text-gray-700 font-medium italic">"{loadingTip}"</p>
                </div>

                <p className="mt-6 text-xs text-gray-400 font-medium">Magie en cours... ne quitte pas !</p>
            </div>
        );
    }

    // FULL SCREEN LAYOUT
    return (
        // Main Container: Fixed Full Screen, below Navbar (assumed 80px)
        <div className="fixed inset-0 top-0 bottom-[0px] z-0 flex flex-col bg-[#FDFBF7]">

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
                    <h1 className="text-lg md:text-2xl font-black text-gray-900 font-serif leading-none truncate max-w-[200px] md:max-w-none">
                        {/* DYNAMIC TITLE REPLACEMENT */}
                        {orderData ? formatTitle(orderData.bookTitle).replace('[Son prénom]', orderData.personalization?.childName) : '...'}
                    </h1>
                    <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Pour {orderData?.personalization?.childName}</p>
                </div>
                <div className="w-10 md:w-20"></div> {/* Spacer */}
            </div>

            {/* MAIN CONTENT AREA - NO PADDING, FULL GROW */}
            <div className="flex-grow w-full relative overflow-hidden">
                <BookReader
                    book={{
                        // Priority to Template Title (orderData.bookTitle) to ensure persistence
                        title: (orderData?.bookTitle || story?.title || "").replace(/\{childName\}|\[Son prénom\]/gi, orderData?.personalization?.childName || "Ton Enfant"),
                        child_name: orderData?.personalization?.childName,
                        cover_url: coverImage, // Use the generated/swapped cover
                        is_unlocked: false, // Always locked in preview until bought
                        id: orderData?.bookId // REQUIRED for Audio API
                    }}
                    extraPages={pages}
                    isEditable={true}
                    onTextChange={(index, newText) => {
                        const pageId = pages[index]?.id;
                        if (pageId) handleEditSave(pageId, newText);
                    }}
                    onUnlock={handleUnlock}
                    enableAudio={false}
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
                        {showReadButton ? (
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
