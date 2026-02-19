import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import * as fal from '@fal-ai/serverless-client';

// Configure Fal
if (process.env.FAL_KEY) {
    fal.config({ credentials: process.env.FAL_KEY });
}

// Supabase admin client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Admin endpoint to manually trigger book generation
 * SECURED: Requires admin authentication
 */
export async function POST(req) {
    let bookId;

    try {
        // 0. SECURITY: Verify Admin Identity
        const cookies = req.cookies;
        const authSupabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() { return cookies.getAll() },
                    setAll() { }
                }
            }
        );

        const { data: { session }, error: authError } = await authSupabase.auth.getSession();
        if (authError || !session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isOwner = session.user.email === 'ibuka.ndjoli@gmail.com';
        const { data: profile } = await authSupabase.from('profiles').select('role').eq('id', session.user.id).single();

        if (!isOwner && profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
        }

        // 1. Get and validate bookId
        const body = await req.json();
        bookId = body.bookId;

        if (!bookId) {
            return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
        }

        console.log(`🚀 [TRIGGER] Starting generation for book ${bookId}`);

        // 2. Fetch book data
        const { data: book, error: fetchError } = await supabaseAdmin
            .from('generated_books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (fetchError || !book) {
            console.error("❌ Book not found:", fetchError);
            return NextResponse.json({ error: "Book not found" }, { status: 404 });
        }

        // 3. Set status to processing
        await supabaseAdmin
            .from('generated_books')
            .update({
                generation_status: 'processing',
                generation_started_at: new Date().toISOString()
            })
            .eq('id', bookId);

        console.log("📊 Status: processing");

        // 4. Get pages and photo
        const rawContent = book.story_content || {};
        const pages = Array.isArray(rawContent) ? rawContent : (rawContent.pages || []);
        const photoUrl = book.child_photo_url;

        if (!pages || pages.length === 0) {
            throw new Error("No pages found");
        }
        if (!photoUrl) {
            throw new Error("No child photo URL");
        }

        console.log(`🎨 Generating ${pages.length} images in parallel...`);

        // 5. Generate all images in parallel
        const pagePromises = pages.map(async (page, index) => {
            try {
                const prompt = `${page.text || page.content}. Photorealistic children's book illustration, natural proportions, warm lighting.`;

                console.log(`  🎨 Page ${index + 1}: Starting...`);

                const result = await fal.subscribe("fal-ai/flux-pulid", {
                    input: {
                        prompt,
                        reference_images: [{ image_url: photoUrl }],
                        num_images: 1,
                        guidance_scale: 3.5,
                        num_inference_steps: 28,
                        enable_safety_checker: false,
                        output_format: "jpeg",
                        negative_prompt: "exaggerated eyes, oversized eyes, anime eyes"
                    },
                    logs: false
                });

                const imageUrl = result.data?.images?.[0]?.url;
                if (!imageUrl) throw new Error("No image URL");

                console.log(`  ✅ Page ${index + 1}: ${imageUrl.substring(0, 50)}...`);
                return { ...page, image: imageUrl, base_image_url: imageUrl };

            } catch (err) {
                console.error(`  ❌ Page ${index + 1}:`, err.message);
                return { ...page, image: page.image || 'https://placehold.co/1024x1024/png?text=Failed' };
            }
        });

        const results = await Promise.all(pagePromises);
        const successCount = results.filter(p => p.image && !p.image.includes('placehold')).length;

        // 6. Update book with results
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

        return NextResponse.json({
            success: true,
            message: "Generation completed",
            bookId,
            generatedCount: successCount,
            totalPages: pages.length
        });

    } catch (error) {
        console.error("🚨 Generation Error:", error);

        // Save error to database
        if (bookId) {
            try {
                await supabaseAdmin
                    .from('generated_books')
                    .update({
                        generation_status: 'failed',
                        generation_error: error.message,
                        generation_completed_at: new Date().toISOString()
                    })
                    .eq('id', bookId);
            } catch (e) {
                console.error("Failed to save error status:", e);
            }
        }

        return NextResponse.json({
            error: error.message,
            bookId,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
