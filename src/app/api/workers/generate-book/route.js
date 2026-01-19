import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import * as fal from '@fal-ai/serverless-client';
import { sendEmail } from '@/lib/resend';
import { BookReadyEmail } from '@/lib/emails/BookReadyEmail';
import { SENDERS } from '@/lib/senders';

// Force dynamic to allow long-running processes
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes allow enough time for 2-step generation

// 🔧 Configure Fal explicitly for Server-Side usage
if (process.env.FAL_KEY) {
    fal.config({
        credentials: process.env.FAL_KEY,
    });
}

/**
 * 2-STEP GENERATION PIPELINE
 * Step 1: Face Swap (Preserves 100% context/background)
 * Step 2: Flux Polish (Unifies lighting/texture, removes sticker effect)
 */
async function generatePersonalizedImage(baseImageUrl, childPhotoUrl, scenePrompt) {
    try {
        console.log("   🔄 Step 1: Face Swap (Identity Injection)...");
        // 1. Face Swap - The Context Keeper
        const swapResult = await fal.subscribe("fal-ai/face-swap", {
            input: {
                base_image_url: baseImageUrl,
                swap_image_url: childPhotoUrl
            },
            logs: true,
        });

        // Robust parsing of Swap Result
        const swappedUrl = swapResult.image?.url || swapResult.images?.[0]?.url;

        if (!swappedUrl) {
            throw new Error("Face Swap returned no URL");
        }

        console.log("   ✨ Step 2: Flux Polish (High Fidelity integration)...");
        // 2. Flux Img2Img - The Quality Enhancer
        // Uses low strength to keep the swapped face but fix lighting/texture
        const polishResult = await fal.subscribe("fal-ai/flux/dev/image-to-image", {
            input: {
                image_url: swappedUrl,
                // Add "expressive face" to prompt to encourage keeping the original expression (open mouth, etc.)
                prompt: scenePrompt + ", highly expressive face, open mouth if shouting, photorealistic, natural lighting, high quality, highly detailed skin texture, cinematic lighting, 8k",
                strength: 0.45, // INCREASED to allow geometry changes (opening mouth)
                num_inference_steps: 30,
                guidance_scale: 3.5,
                enable_safety_checker: false,
                output_format: "jpeg"
            },
            logs: true,
        });

        const finalUrl = polishResult.images?.[0]?.url;

        if (!finalUrl) {
            console.warn("   ⚠️ Polish step failed, falling back to swapped image");
            return swappedUrl; // Fallback to at least having the swapped face
        }

        return finalUrl;

    } catch (error) {
        console.error("   ❌ Pipeline Error:", error.message);
        throw error;
    }
}

export async function POST(req) {
    console.log("👷 WORKER START: Generate Book with FaceSwap V2 + Flux Polish");

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

        // 2. COVER IMAGE
        let currentCoverUrl = book.cover_image_url || book.cover_url;

        // Note: For cover, if it's already a generated illustration (from template), we apply the pipeline.
        // If it's empty, we might skip. assuming cover_url exists from story template.
        if (photoUrl && currentCoverUrl && !currentCoverUrl.includes("fal.media")) {
            console.log("🎨 Generating Personalized Cover...");
            try {
                // Use title + standard prompt for polish
                const coverPrompt = `Cover illustration for children's book titled "${book.title}", ${book.child_gender === 'Fille' ? 'young african girl' : 'young african boy'} hero, vibrant colors`;

                const newCoverUrl = await generatePersonalizedImage(currentCoverUrl, photoUrl, coverPrompt);

                if (newCoverUrl) {
                    console.log("✅ Cover Generated Successfully!");
                    currentCoverUrl = newCoverUrl;
                    hasChanges = true;
                }
            } catch (err) {
                console.error("❌ Cover Generation Failed:", err.message);
            }
        } else if (currentCoverUrl && currentCoverUrl.includes("fal.media")) {
            console.log("ℹ️ Cover likely already personalized, skipping.");
        }

        // 3. PAGES LOOP - Apply 2-Step Pipeline
        // Loop through pages and personalize standard illustrations
        for (let i = 0; i < updatedPages.length; i++) {
            const page = updatedPages[i];

            // We need a base image to swap onto.
            // Usually 'image' field holds the template illustration URL initially.
            // If page.image is already personalized (fal.media), we skip to avoid double-processing (cost saving).
            // BUT for this overhaul, we might want to force regenerate if requested?
            // For now, assume standard workflow: input is template image.

            const baseImage = page.image || page.base_image_url;

            if (!baseImage) {
                console.log(`   ⏭️ Skating Page ${i + 1} (No base image)`);
                continue;
            }

            // Skip if ALREADY personalized (safety check for idempotency)
            // Remove check if you want to allow re-runs by clearing DB images first.
            // For now, we process if it doesn't look like a fal result OR if we force it.
            // Actually, let's process it.

            console.log(`🎭 Processing Page ${i + 1} / ${updatedPages.length}...`);

            try {
                // Construct scene prompt based on page text for the Polish step
                const pagePrompt = `${page.scene_description || page.text || "Children's book illustration"}, ${book.child_gender === 'Fille' ? 'african girl' : 'african boy'}`;

                const generatedImageUrl = await generatePersonalizedImage(baseImage, photoUrl, pagePrompt);

                updatedPages[i] = {
                    ...page,
                    image: generatedImageUrl,
                    base_image_url: baseImage // Ensure we keep original ref
                };

                hasChanges = true;
                generatedCount++;
                console.log(`   ✅ Page ${i + 1} Done`);

            } catch (err) {
                console.error(`   ❌ Failed Page ${i + 1}:`, err.message);
                // Keep original simple image if fail
            }
        }

        // 4. Save Updates & Send Email
        if (hasChanges) {
            let newStoryContent = Array.isArray(book.story_content) ? updatedPages : { ...book.story_content, pages: updatedPages };

            let updates = {
                story_content: newStoryContent,
                cover_image_url: currentCoverUrl,
                status: 'completed' // Mark as fully done
            };

            const { error: updateError } = await supabase
                .from('generated_books')
                .update(updates)
                .eq('id', bookId);

            if (updateError) {
                console.error("❌ Failed to update book in DB:", updateError);
                return NextResponse.json({ error: "DB Update Failed" }, { status: 500 });
            }
            console.log("💾 Book updated in Database.");

            // GENERATE SECURE DOWNLOAD TOKEN & SEND PDF EMAIL
            if (book.email) {
                let downloadUrl = 'https://www.kusomakids.com/login';

                try {
                    const crypto = require('crypto');
                    const downloadToken = crypto.randomBytes(32).toString('hex');

                    // Admin client for token insert
                    const { createClient: createAdmin } = require('@supabase/supabase-js');
                    const supabaseAdmin = createAdmin(
                        process.env.NEXT_PUBLIC_SUPABASE_URL,
                        process.env.SUPABASE_SERVICE_ROLE_KEY,
                        { auth: { autoRefreshToken: false, persistSession: false } }
                    );

                    const { error: tokenError } = await supabaseAdmin
                        .from('download_tokens')
                        .insert({
                            book_id: bookId,
                            token: downloadToken,
                            email: book.email,
                            downloads_remaining: 3,
                            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                        });

                    if (!tokenError) {
                        downloadUrl = `https://www.kusomakids.com/api/download-secure/${bookId}?token=${downloadToken}`;
                    }
                } catch (e) { console.error("Token error", e); }

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
                    console.log("✅ Email sent.");
                } catch (emailErr) {
                    console.error("❌ Email failed:", emailErr);
                }
            }
        }

        console.log(`✨ Worker Complete: ${generatedCount} images personalized.`);

        return NextResponse.json({
            success: true,
            generatedCount,
            message: "Worker finished - FaceSwap V2 pipeline"
        });

    } catch (error) {
        console.error("🚨 Worker Critical Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
