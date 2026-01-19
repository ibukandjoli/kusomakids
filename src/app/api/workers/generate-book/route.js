import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as fal from '@fal-ai/serverless-client';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configure Fal
if (process.env.FAL_KEY) {
    fal.config({ credentials: process.env.FAL_KEY });
}

/**
 * Shared worker logic that can be called directly or via API
 * @param {string} bookId - ID of the book to generate images for
 * @returns {Promise<{success: boolean, generatedCount: number, error?: string}>}
 */
export async function executeGeneration(bookId) {
    console.log(`👷 WORKER START: Generate Book ${bookId}`);

    try {
        // 1. Fetch book
        const { data: book, error: fetchError } = await supabaseAdmin
            .from('generated_books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (fetchError || !book) {
            throw new Error(`Book not found: ${fetchError?.message}`);
        }

        // 2. Set status to processing
        await supabaseAdmin
            .from('generated_books')
            .update({
                generation_status: 'processing',
                generation_started_at: new Date().toISOString()
            })
            .eq('id', bookId);

        console.log("📊 Status set to 'processing'");

        // 3. Get pages
        const rawContent = book.story_content || {};
        const pages = Array.isArray(rawContent) ? rawContent : (rawContent.pages || []);

        if (!pages || pages.length === 0) {
            throw new Error("No pages found in book content");
        }

        const photoUrl = book.child_photo_url;
        if (!photoUrl) {
            throw new Error("No child photo URL found");
        }

        console.log(`🎨 Generating ${pages.length} images in parallel...`);

        // 4. Generate all images in parallel
        const pagePromises = pages.map(async (page, index) => {
            try {
                const prompt = `${page.text || page.content}. Photorealistic children's book illustration, natural proportions, warm lighting.`;

                const result = await fal.subscribe("fal-ai/flux-pulid", {
                    input: {
                        prompt,
                        reference_images: [{ image_url: photoUrl }],
                        num_images: 1,
                        guidance_scale: 3.5,
                        num_inference_steps: 28,
                        enable_safety_checker: false,
                        output_format: "jpeg",
                        negative_prompt: "exaggerated eyes, oversized eyes, anime eyes, cartoon eyes"
                    },
                    logs: false
                });

                const imageUrl = result.data?.images?.[0]?.url;
                if (!imageUrl) throw new Error("No image URL returned");

                console.log(`  ✅ Page ${index + 1} generated`);
                return { ...page, image: imageUrl, base_image_url: imageUrl };

            } catch (err) {
                console.error(`❌ Page ${index + 1} failed:`, err.message);
                return { ...page, image: page.image || 'https://placehold.co/1024x1024/png?text=Failed' };
            }
        });

        const results = await Promise.all(pagePromises);
        const successCount = results.filter(p => p.image && !p.image.includes('placehold')).length;

        // 5. Update book with results
        const newContent = Array.isArray(rawContent) ? results : { ...rawContent, pages: results };

        await supabaseAdmin
            .from('generated_books')
            .update({
                story_content: newContent,
                generation_status: 'completed',
                generation_completed_at: new Date().toISOString(),
                images_generated_count: successCount,
                generation_error: null
            })
            .eq('id', bookId);

        console.log(`✅ Generation complete: ${successCount}/${pages.length} images`);

        return { success: true, generatedCount: successCount };

    } catch (error) {
        console.error("🚨 Worker Error:", error);

        // Save error to DB
        await supabaseAdmin
            .from('generated_books')
            .update({
                generation_status: 'failed',
                generation_error: error.message,
                generation_completed_at: new Date().toISOString()
            })
            .eq('id', bookId);

        return { success: false, error: error.message, generatedCount: 0 };
    }
}

/**
 * API endpoint (for backward compatibility)
 */
export async function POST(req) {
    const { bookId } = await req.json();
    if (!bookId) {
        return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
    }

    const result = await executeGeneration(bookId);

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
}

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
