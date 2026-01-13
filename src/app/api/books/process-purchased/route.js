import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { fal } from '@fal-ai/serverless-client';

export const maxDuration = 300; // 5 minutes (if Vercel Pro, ignored on Free but good practice)

export async function POST(req) {
    console.log("🛠️ Worker: process-purchased triggered");

    // 1. Auth & Input Validation
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    // Note: We might want to allow Servce Role calling this if triggered by webhook?
    // For now, triggered by User interaction (Dashboard unlock) -> Session required.

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bookId } = body;

    try {
        // 2. Fetch Book Data
        const { data: book, error: fetchError } = await supabase
            .from('generated_books')
            .select('*')
            .eq('id', bookId)
            .eq('user_id', session.user.id)
            .single();

        if (fetchError || !book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        console.log(`📘 Processing Book: ${book.title} (ID: ${bookId})`);

        // 3. Prepare Generation Loop
        let pages = book.content_json?.pages || [];
        let updated = false;

        // Parallel processing promises
        const generationPromises = pages.map(async (page, index) => {
            // Logic: Skip valid images
            if (page.image && !page.image.includes('placeholder') && !page.image.includes('blur')) {
                return page;
            }

            // Logic: Skip Page 1-2 if they are already done? (Index 0, 1)
            // But if they were placeholders (e.g. error), we regenerate.
            // Strict rule: If it's a placeholder -> REGENERATE.
            // Current placeholder URL contains 'placeholder' or 'blur' or is just the cover URL.
            // Check if URL equals Cover URL?
            const isPlaceholder = !page.image ||
                page.image.includes('placeholder') ||
                page.image.includes('blur') ||
                page.image === book.cover_url;

            if (!isPlaceholder) return page;

            console.log(`🎨 Generating Page ${index + 1}...`);

            try {
                // A. TEXT TO IMAGE
                // Reconstruct Attributes
                const physicalAttributes = `african ${book.child_gender === 'Fille' ? 'girl' : 'boy'}, ${book.child_age} years old`;
                // Add photo attributes if exists? "dark skin" etc should come from user selection if we had it.
                // For now, default "african child" + provided prompt.

                const prompt = `${physicalAttributes}, ${page.imagePrompt || page.text}, pixar style, vibrant colors, masterpiece, best quality, wide shot, cinematic lighting`;

                const sceneResult = await fal.subscribe("fal-ai/flux/dev", {
                    input: {
                        prompt: prompt,
                        image_size: "landscape_4_3",
                        num_inference_steps: 28,
                        guidance_scale: 3.5
                    }
                });

                let imageUrl = sceneResult.images?.[0]?.url;

                // B. FACE SWAP (If Photo Exists)
                if (book.child_photo_url && imageUrl) {
                    try {
                        const swapResult = await fal.subscribe("fal-ai/face-swap", {
                            input: {
                                base_image_url: imageUrl,
                                swap_image_url: book.child_photo_url
                            }
                        });
                        if (swapResult.images?.[0]?.url) {
                            imageUrl = swapResult.images[0].url;
                        }
                    } catch (swapErr) {
                        console.error(`⚠️ Face Swap failed for Page ${index + 1}:`, swapErr);
                        // Fallback to scene
                    }
                }

                if (imageUrl) {
                    updated = true;
                    return { ...page, image: imageUrl };
                }
                return page; // Failed generation returns original (retry later?)

            } catch (err) {
                console.error(`❌ Error generating Page ${index + 1}:`, err);
                return page;
            }
        });

        // Wait for all generations
        const newPages = await Promise.all(generationPromises);

        // 4. Update Database
        if (updated) {
            const { error: updateError } = await supabase
                .from('generated_books')
                .update({
                    content_json: { ...book.content_json, pages: newPages },
                    status: 'completed' // or 'purchased' (it's already purchased)
                })
                .eq('id', bookId);

            if (updateError) throw updateError;
            console.log("✅ Book updated with new images.");
        } else {
            console.log("✨ No pages needed update.");
        }

        return NextResponse.json({ success: true, pagesGenerated: updated });

    } catch (error) {
        console.error("🚨 Worker Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
