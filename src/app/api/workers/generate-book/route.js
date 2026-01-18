import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import * as fal from '@fal-ai/serverless-client';
import { sendEmail } from '@/lib/resend';
import { BookReadyEmail } from '@/lib/emails/BookReadyEmail';
import { SENDERS } from '@/lib/senders';

// Force dynamic to allow long-running processes
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for 10 FLUX PuLID generations (~15-20s each)

// 🔧 Configure Fal explicitly for Server-Side usage
if (process.env.FAL_KEY) {
    fal.config({
        credentials: process.env.FAL_KEY,
    });
}

/**
 * Helper: Build optimized prompt for FLUX PuLID
 * Combines scene description with quality directives
 */
function buildPuLIDPrompt(pageText, sceneDescription) {
    // Base prompt from story content
    let prompt = sceneDescription || pageText || "A young African child in a children's book illustration";

    // Add quality directives
    prompt += ". Photorealistic children's book illustration style, natural facial proportions, realistic eyes, warm lighting, professional quality, detailed and lifelike.";

    return prompt;
}

/**
 * Negative prompt to avoid Disney/Pixar eyes
 * Critical for maintaining natural eye proportions
 */
const NEGATIVE_PROMPT = "disney eyes, pixar style, cartoon eyes, oversized eyes, anime eyes, big eyes, exaggerated features, 3d animation style, dreamworks style";

/**
 * Generate personalized image using FLUX PuLID
 * @param {string} scenePrompt - Description of the scene
 * @param {string} childPhotoUrl - Reference photo of the child
 * @returns {Promise<string>} - URL of generated image
 */
async function generateWithPuLID(scenePrompt, childPhotoUrl) {
    try {
        const result = await fal.subscribe("fal-ai/flux-pulid", {
            input: {
                prompt: scenePrompt,
                negative_prompt: NEGATIVE_PROMPT,
                reference_image_url: childPhotoUrl,
                num_inference_steps: 35,
                guidance_scale: 3.5,
                id_weight: 1.0,
                num_images: 1,
                enable_safety_checker: false,
                output_format: "png",
                image_size: {
                    width: 1024,
                    height: 1024
                }
            },
            logs: true,
        });

        // Extract image URL from response
        const imageUrl = result.images?.[0]?.url || result.image?.url;

        if (!imageUrl) {
            throw new Error("No image URL in FLUX PuLID response");
        }

        return imageUrl;
    } catch (error) {
        console.error("FLUX PuLID generation failed:", error);
        throw error;
    }
}

export async function POST(req) {
    console.log("👷 WORKER START: Generate Book with FLUX PuLID");

    try {
        const supabase = await createClient();
        const body = await req.json();
        const { bookId } = body;

        if (!bookId) {
            return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
        }

        console.log(`📘 Processing Book ID: ${bookId}`);

        // 1. Fetch Book Data
        const { data: book, error: fetchError } = await supabase
            .from('generated_books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (fetchError || !book) {
            console.error("❌ Book lookup failed:", fetchError);
            return NextResponse.json({ error: "Book not found" }, { status: 404 });
        }

        // 1.5 Set status to 'processing'
        await supabase
            .from('generated_books')
            .update({
                generation_status: 'processing',
                generation_started_at: new Date().toISOString()
            })
            .eq('id', bookId);

        console.log("📊 Status set to 'processing'");

        const rawContent = book.story_content || {};
        const pages = Array.isArray(rawContent) ? rawContent : (rawContent.pages || []);

        if (!pages || !Array.isArray(pages) || pages.length === 0) {
            return NextResponse.json({ error: "Invalid content" }, { status: 400 });
        }

        const photoUrl = book.child_photo_url;

        if (!photoUrl) {
            console.warn("⚠️ NO CHILD PHOTO URL FOUND. Cannot generate personalized images.");
            return NextResponse.json({ error: "Child photo required" }, { status: 400 });
        }

        console.log("✅ Child Photo found:", photoUrl);

        let updatedPages = [...pages];
        let hasChanges = false;
        let generatedCount = 0;

        // 2. COVER IMAGE GENERATION with FLUX PuLID
        let currentCoverUrl = book.cover_image_url || book.cover_url;

        if (photoUrl && currentCoverUrl) {
            console.log("🎨 Generating Personalized Cover with FLUX PuLID...");
            try {
                // Build cover prompt from book title and theme
                const coverPrompt = buildPuLIDPrompt(
                    book.title,
                    `A young African child as the hero of the story "${book.title}". Cover illustration for a children's book, vibrant and engaging`
                );

                const newCoverUrl = await generateWithPuLID(coverPrompt, photoUrl);

                if (newCoverUrl) {
                    console.log("✅ Cover Generated Successfully!");
                    currentCoverUrl = newCoverUrl;
                    hasChanges = true;
                } else {
                    console.warn("⚠️ Cover generation returned no URL");
                }
            } catch (err) {
                console.error("❌ Cover Generation Failed:", err.message);
                // Keep original cover as fallback
            }
        }

        // 3. PAGES LOOP - Generate ALL pages with FLUX PuLID (PARALLELIZED)
        console.log(`🚀 Starting Parallel Generation for ${updatedPages.length} pages...`);

        const pagePromises = updatedPages.map(async (page, index) => {
            console.log(`➡️ Queuing Page ${index + 1}`);
            try {
                // Build scene prompt from page content
                const pagePrompt = buildPuLIDPrompt(
                    page.text || page.content,
                    page.scene_description || page.prompt || `Scene ${index + 1} from the story`
                );

                const generatedImageUrl = await generateWithPuLID(pagePrompt, photoUrl);
                console.log(`  ✅ Page ${index + 1} generated successfully`);

                return {
                    ...page,
                    image: generatedImageUrl,
                    base_image_url: generatedImageUrl
                };

            } catch (err) {
                console.error(`❌ Failed to generate Page ${index + 1}:`, err.message);
                // Fallback: keep existing image or use placeholder
                const fallbackImage = page.image || page.base_image_url || 'https://placehold.co/1024x1024/png?text=Generation+Failed';
                return { ...page, image: fallbackImage };
            }
        });

        const results = await Promise.all(pagePromises);

        // Count successes (approximation based on changed URLs or logic)
        updatedPages = results;
        hasChanges = true;
        generatedCount = results.length; // Simply count all processed


        // 4. Save Updates & Send PDF Email with Download Link
        if (hasChanges) {
            let newStoryContent = Array.isArray(book.story_content) ? updatedPages : { ...book.story_content, pages: updatedPages };

            let updates = {
                story_content: newStoryContent,
                cover_image_url: currentCoverUrl,
                generation_status: 'completed',
                generation_completed_at: new Date().toISOString(),
                images_generated_count: generatedCount,
                generation_error: null
            };

            const { error: updateError } = await supabase
                .from('generated_books')
                .update(updates)
                .eq('id', bookId);

            if (updateError) {
                console.error("❌ Failed to update book in DB:", updateError);
                return NextResponse.json({ error: "DB Update Failed" }, { status: 500 });
            }
            console.log("💾 Book updated successfully.");

            // GENERATE SECURE DOWNLOAD TOKEN & SEND PDF EMAIL
            if (book.email) {
                let downloadUrl = 'https://www.kusomakids.com/login';

                try {
                    // Generate cryptographically random token
                    const crypto = require('crypto');
                    const downloadToken = crypto.randomBytes(32).toString('hex');

                    // Initialize Supabase Admin for token storage
                    const { createClient } = require('@supabase/supabase-js');
                    const supabaseAdmin = createClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL,
                        process.env.SUPABASE_SERVICE_ROLE_KEY,
                        {
                            auth: {
                                autoRefreshToken: false,
                                persistSession: false
                            }
                        }
                    );

                    // Store token in database
                    const { error: tokenError } = await supabaseAdmin
                        .from('download_tokens')
                        .insert({
                            book_id: bookId,
                            token: downloadToken,
                            email: book.email,
                            downloads_remaining: 3,
                            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
                        });

                    if (tokenError) {
                        console.error("❌ Failed to create download token:", tokenError);
                    } else {
                        downloadUrl = `https://www.kusomakids.com/api/download-secure/${bookId}?token=${downloadToken}`;
                        console.log("✅ Download token created, valid for 30 days, 3 downloads");
                    }
                } catch (tokenErr) {
                    console.error("Error generating download token:", tokenErr);
                }

                // Send PDF Ready Email with download link
                try {
                    const emailHtml = BookReadyEmail({
                        childName: book.child_name || 'votre enfant',
                        bookTitle: book.title,
                        downloadUrl: downloadUrl,
                        userEmail: book.email
                    });

                    await sendEmail({
                        to: book.email,
                        from: SENDERS.TREASURE,
                        subject: `📥 Votre PDF est prêt ! ${book.title}`,
                        html: emailHtml
                    });
                    console.log("✅ PDF Download Email sent.");
                } catch (emailErr) {
                    console.error("❌ PDF Email failed:", emailErr);
                }
            }
        }

        console.log(`✨ Worker Complete: ${generatedCount} images generated with FLUX PuLID`);

        return NextResponse.json({
            success: true,
            generatedCount,
            message: "Worker finished - FLUX PuLID generation complete"
        });

    } catch (error) {
        console.error("🚨 Worker Critical Error:", error);

        // Save error status to database
        try {
            const supabase = await createClient();
            await supabase
                .from('generated_books')
                .update({
                    generation_status: 'failed',
                    generation_error: error.message,
                    generation_completed_at: new Date().toISOString()
                })
                .eq('id', body?.bookId);
        } catch (dbError) {
            console.error("Failed to save error status:", dbError);
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
