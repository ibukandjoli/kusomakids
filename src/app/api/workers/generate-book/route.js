import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { fal } from '@fal-ai/serverless-client';
import { sendEmail } from '@/lib/resend';
import { BookReadyEmail } from '@/lib/emails/BookReadyEmail';
import { SENDERS } from '@/lib/senders';

// Force dynamic to allow long-running processes
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// 🔧 CRITICAL FIX: Configure Fal explicitly for Server-Side usage
// This tells Fal to use the Env Key directly and NOT look for a proxy
if (process.env.FAL_KEY) {
    fal.config({
        credentials: process.env.FAL_KEY,
    });
}

export async function POST(req) {
    console.log("👷 WORKER START: Generate Book Background Process");

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

        // Log photo status specifically
        if (!photoUrl) {
            console.warn("⚠️ NO CHILD PHOTO URL FOUND. Skipping Face Swap.");
        } else {
            console.log("✅ Child Photo found:", photoUrl);
        }

        let updatedPages = [...pages];
        let hasChanges = false;
        let generatedCount = 0;

        // 0. COVER IMAGE SWAP
        let currentCoverUrl = book.cover_image_url || book.cover_url;

        if (currentCoverUrl && photoUrl && !currentCoverUrl.includes('fal.media')) {
            console.log("🎨 Personalizing Cover...");
            try {
                const coverResult = await fal.subscribe("fal-ai/face-swap", {
                    input: {
                        base_image_url: currentCoverUrl,
                        swap_image_url: photoUrl
                    },
                    logs: true,
                });

                // 🔧 FIX: Handle both 'image' (object) and 'images' (array) response formats
                const newCoverUrl = coverResult.image?.url || coverResult.images?.[0]?.url || coverResult.data?.image?.url || coverResult.data?.images?.[0]?.url;

                if (newCoverUrl) {
                    console.log("✅ Cover Swapped Successfully!");
                    currentCoverUrl = newCoverUrl;
                    hasChanges = true;
                } else {
                    console.warn("⚠️ Cover Swap returned no URL. Result:", JSON.stringify(coverResult));
                }
            } catch (err) {
                console.error("❌ Cover Swap Failed:", err.message);
            }
        }

        // 2. PAGES LOOP (Face Swap)
        for (let i = 0; i < updatedPages.length; i++) {
            const page = updatedPages[i];

            // Check if page already processed
            const hasValidImage = page.image && page.image.includes('fal.media');
            if (hasValidImage) {
                continue;
            }

            const baseImageUrl = page.base_image_url;
            if (!baseImageUrl) {
                continue; // Skip pages without templates
            }

            console.log(`🎭 Processing Page ${i + 1} / ${updatedPages.length}...`);
            let finalImageUrl = baseImageUrl;

            try {
                if (photoUrl) {
                    // PERFORM FACE SWAP
                    const swapResult = await fal.subscribe("fal-ai/face-swap", {
                        input: {
                            base_image_url: baseImageUrl,
                            swap_image_url: photoUrl
                        },
                        logs: true,
                    });

                    // 🔧 FIX: Robust response parsing
                    const swappedUrl = swapResult.image?.url || swapResult.images?.[0]?.url || swapResult.data?.image?.url || swapResult.data?.images?.[0]?.url;

                    if (swappedUrl) {
                        finalImageUrl = swappedUrl;
                        console.log(`> Swapped successfully.`);
                    } else {
                        console.warn(`> Warning: No image URL in response for page ${i + 1}. Result:`, JSON.stringify(swapResult));
                    }
                }

                updatedPages[i] = {
                    ...page,
                    image: finalImageUrl
                };
                hasChanges = true;
                generatedCount++;

            } catch (err) {
                console.error(`❌ Failed to process Page ${i + 1}:`, err.message);
                // Fallback to base image so the book isn't broken
                updatedPages[i] = { ...page, image: baseImageUrl };
                hasChanges = true;
            }
        }

        // 3. Save Updates & Email
        if (hasChanges) {
            let newStoryContent = Array.isArray(book.story_content) ? updatedPages : { ...book.story_content, pages: updatedPages };

            let updates = {
                story_content: newStoryContent,
                cover_image_url: currentCoverUrl
                // status: 'completed'  <-- REMOVED TO PREVENT 500 ERROR (Column does not exist)
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

            // Send Email
            if (book.email) {
                try {
                    const emailHtml = BookReadyEmail({
                        childName: book.child_name || 'votre enfant',
                        bookTitle: book.title,
                        previewUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kusomakids.com'}/book/${book.id}/preview`
                    });

                    await sendEmail({
                        to: book.email,
                        from: SENDERS.TREASURE,
                        subject: `L'histoire de ${book.child_name || 'votre enfant'} est prête ! 📖✨`,
                        html: emailHtml
                    });
                    console.log("✅ Email sent.");
                } catch (emailErr) {
                    console.error("❌ Email failed:", emailErr);
                }
            }
        }

        return NextResponse.json({
            success: true,
            generatedCount,
            message: "Worker finished"
        });

    } catch (error) {
        console.error("🚨 Worker Critical Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
