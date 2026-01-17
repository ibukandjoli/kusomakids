import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import * as fal from '@fal-ai/serverless-client';

export const maxDuration = 300;

// Configure Fal
if (process.env.FAL_KEY) {
    fal.config({
        credentials: process.env.FAL_KEY,
    });
}

export async function POST(req) {
    console.log("🛠️ Worker: process-purchased triggered");

    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { bookId } = body;

        // 1. Fetch Book Data
        const { data: book, error: fetchError } = await supabase
            .from('generated_books')
            .select('*')
            .eq('id', bookId)
            .eq('user_id', session.user.id)
            .single();

        if (fetchError || !book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        console.log(`📘 Processing Book: ${book.title_template || book.title} (ID: ${bookId})`);

        // 2. Prepare Generation Loop
        // SCHEMA FIX: content_json -> story_content
        const rawContent = book.story_content || {};
        let pages = Array.isArray(rawContent) ? rawContent : (rawContent.pages || []);

        let updated = false;

        // Parallel processing
        const generationPromises = pages.map(async (page, index) => {
            // Skip valid images
            if (page.image && !page.image.includes('placeholder') && !page.image.includes('blur') && page.image.startsWith('http')) {
                return page;
            }

            // Logic: If it's the cover URL (placeholder) or explicitly invalid, regen.
            const isPlaceholder = !page.image ||
                page.image.includes('placeholder') ||
                page.image.includes('blur') ||
                page.image === book.cover_url; // Often we set page image = cover url as placeholder

            if (!isPlaceholder) return page;

            console.log(`🎨 Generating Page ${index + 1}...`);

            try {
                // A. TEXT TO IMAGE
                const physicalAttributes = `african ${book.child_gender === 'Fille' ? 'girl' : 'boy'}, ${book.child_age || 5} years old`;
                const prompt = `${physicalAttributes}, ${page.imagePrompt || page.text}, pixar style, vibrant colors, masterpiece, best quality, wide shot, cinematic lighting`;

                const sceneResult = await fal.subscribe("fal-ai/flux/dev", {
                    input: {
                        prompt: prompt,
                        image_size: "landscape_4_3",
                        num_inference_steps: 28,
                        guidance_scale: 3.5
                    }
                });

                let imageUrl = sceneResult.images?.[0]?.url || sceneResult.data?.images?.[0]?.url;

                // B. FACE SWAP (If Photo Exists)
                if (book.child_photo_url && imageUrl) {
                    try {
                        const swapResult = await fal.subscribe("fal-ai/face-swap", {
                            input: {
                                base_image_url: imageUrl,
                                swap_image_url: book.child_photo_url
                            }
                        });

                        // Robust Parsing
                        const swappedUrl = swapResult.image?.url || swapResult.images?.[0]?.url || swapResult.data?.image?.url || swapResult.data?.images?.[0]?.url;

                        if (swappedUrl) {
                            imageUrl = swappedUrl;
                        }
                    } catch (swapErr) {
                        console.error(`⚠️ Face Swap failed for Page ${index + 1}:`, swapErr);
                    }
                }

                if (imageUrl) {
                    updated = true;
                    return { ...page, image: imageUrl };
                }
                return page;

            } catch (err) {
                console.error(`❌ Error generating Page ${index + 1}:`, err);
                return page;
            }
        });

        const newPages = await Promise.all(generationPromises);

        // 3. Update Database
        if (updated) {
            // Handle JSON structure (Array vs Object)
            const newContent = Array.isArray(book.story_content) ? newPages : { ...book.story_content, pages: newPages };

            const { error: updateError } = await supabase
                .from('generated_books')
                .update({
                    story_content: newContent
                    // REMOVED status update to prevent error
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
