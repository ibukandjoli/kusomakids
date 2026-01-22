import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; // Use admin client for worker
import * as fal from '@fal-ai/serverless-client';
import { sendEmail } from '@/lib/resend';
import { BookReadyEmail } from '@/lib/emails/BookReadyEmail';
import { SENDERS } from '@/lib/senders';

// Force dynamic to allow long-running processes (Vercel functionality)
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

// Configure Fal
if (process.env.FAL_KEY) {
    fal.config({
        credentials: process.env.FAL_KEY,
    });
}

import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ... imports ...

// Initialize Supabase Admin
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req) {
    console.log("🪄 WORKER START: Generate Magic Book (2D)");

    try {
        const { bookId, pages: submittedPages } = await req.json();
        // ... (validation checks) ...

        // 1. Fetch Book Data
        const { data: book, error: fetchError } = await supabaseAdmin
            .from('generated_books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (fetchError || !book) { /* ... */ }

        const rawContent = book.story_content || {};
        const dbPages = Array.isArray(rawContent.pages) ? rawContent.pages : [];
        const pages = Array.isArray(submittedPages) ? submittedPages : dbPages;
        const childName = book.child_name || "l'enfant";

        // Define mergedPages (Missing Fix)
        const mergedPages = pages.map((p, i) => ({
            ...dbPages[i],
            ...p
        }));

        // --- DYNAMIC CHARACTER DESCRIPTION ---
        let CHARACTER_STYLE = "enfant africain, peau noire, cheveux crépus ou tressés"; // Default
        const referenceImage = rawContent.reference_image;

        if (referenceImage) {
            try {
                console.log("📸 Analyzing reference photo:", referenceImage);
                const descriptionCompletion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "system",
                            content: "You are an expert at describing character appearances for AI image generation. Describe the child in this photo in 1 concise sentence, focusing STRICTLY on physical features: hairstyle, skin tone, face shape, and distinctive clothing if visible. Do not mention background or pose. Start with 'A young african child...'"
                        },
                        {
                            role: "user",
                            content: [
                                { type: "text", text: "Describe this child." },
                                { type: "image_url", image_url: { url: referenceImage } }
                            ]
                        }
                    ],
                    max_tokens: 100
                });

                const analysis = descriptionCompletion.choices[0].message.content;
                if (analysis) {
                    console.log("✨ Photo Analysis:", analysis);
                    // Append specific style enforcement to the analysis
                    CHARACTER_STYLE = analysis.replace(/\.$/, "") + ", smiling, expressive face";
                }
            } catch (visionError) {
                console.error("⚠️ Vision Analysis Failed:", visionError);
                // Fallback to default
            }
        }

        // MODIFIED: More specific style instructions for Ghibli/Anime look
        // Uses "Studio Ghibli screencap" and "cel shaded" which are stronger triggers
        const STYLE_SUFFIX = `, ${CHARACTER_STYLE}, masterpiece, studio ghibli style, anime screencap, cel shaded, hayao miyazaki style, vibrant colors, detailed background, no 3d render, no cgi, flat color`;


        if (mergedPages.length === 0) {
            return NextResponse.json({ error: "No pages to generate" }, { status: 400 });
        }

        let generatedCount = 0;

        // 2. Generate Images for Each Page (Parallel)
        console.log("🎨 Starting parallel generation for all pages...");

        const processedPages = await Promise.all(mergedPages.map(async (page, index) => {
            try {
                // If page already has image, preserve it? Or force regenerate?
                // The user clicked "Generate", so usually implies force (or missing).
                // Let's force generate for now.

                const prompt = (page.image_prompt || page.text) + STYLE_SUFFIX;

                // Using fal.subscribe for checking status
                const result = await fal.subscribe("fal-ai/flux/dev", {
                    input: {
                        prompt: prompt,
                        image_size: "landscape_4_3",
                        num_inference_steps: 28,
                        guidance_scale: 3.5,
                        enable_safety_checker: false
                    },
                    logs: true
                });

                const imageUrl = result.images?.[0]?.url;

                if (imageUrl) {
                    generatedCount++;
                    console.log(`   ✅ Page ${index + 1} Done: ${imageUrl}`);
                    return {
                        ...page,
                        image: imageUrl,
                        image_url: imageUrl
                    };
                } else {
                    console.error(`   ❌ No URL for Page ${index + 1}`, result);
                    return page; // Return original if failed
                }
            } catch (err) {
                console.error(`   ❌ Failed Page ${index + 1}:`, err.message);
                return page; // Return original if failed
            }
        }));

        // 3. Save Updates
        // Fetch FRESH book to ensure we don't overwrite concurrent changes
        const { data: freshBook, error: freshError } = await supabaseAdmin
            .from('generated_books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (freshError) console.error("⚠️ Could not fetch fresh book, using stale data");

        const baseContent = freshBook?.story_content || rawContent;
        const newStoryContent = { ...baseContent, pages: processedPages };

        // Determine cover image (prefer page 1)
        const firstPageImage = processedPages[0]?.image || processedPages[0]?.image_url;
        // Existing cover or new one
        const finalCoverUrl = freshBook?.cover_image_url || firstPageImage;

        console.log("💾 Saving content with images count:", generatedCount);

        const { error: updateError } = await supabaseAdmin
            .from('generated_books')
            .update({
                story_content: newStoryContent,
                cover_image_url: finalCoverUrl, // EXPLICITLY SET COVER
                generation_status: 'completed' // Mark as ready
            })
            .eq('id', bookId);

        if (updateError) {
            console.error("❌ CRITICAL: DB Update Failed:", updateError);
            throw new Error(`DB Save Failed: ${updateError.message}`);
        }

        console.log("💾 Book updated successfully. Status set to completed.");

        // 4. Send Email (Optional for V1 Magic Story? Assuming user is waiting on dashboard? 
        // But process takes time. Let's send email to be nice.)
        // The user might be waiting on the "Progress" screen.
        // We can skip email if not strictly required, but good for UX.
        // Let's reuse BookReadyEmail if we have email.

        // Get user email
        const { data: user } = await supabaseAdmin.auth.admin.getUserById(book.user_id);
        const userEmail = user?.user?.email;

        if (userEmail) {
            const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/purchased`; // Direct link to dashboard
            try {
                const emailHtml = BookReadyEmail({
                    childName: childName,
                    bookTitle: rawContent.title || "Votre histoire magique",
                    downloadUrl: downloadUrl,
                    userEmail: userEmail
                });

                await sendEmail({
                    to: userEmail,
                    from: SENDERS.TREASURE,
                    subject: `✨ Votre histoire magique est prête !`,
                    html: emailHtml
                });
                console.log("✅ Notification email sent.");
            } catch (e) {
                console.error("Email error:", e);
            }
        }

        return NextResponse.json({ success: true, count: generatedCount });

    } catch (error) {
        console.error("🚨 Worker Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
