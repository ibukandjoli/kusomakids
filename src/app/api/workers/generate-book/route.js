import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { fal } from '@fal-ai/serverless-client';
import { sendEmail } from '@/lib/resend';
import { BookReadyEmail } from '@/lib/emails/BookReadyEmail';
import { SENDERS } from '@/lib/senders';

// Force dynamic to allow long-running processes (though Vercel has limits)
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Attempt to extend duration if allowed (Pro: 300s, Hobby: 10/60s)

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

        // 1. Fetch Book Data & Personalization
        const { data: book, error: fetchError } = await supabase
            .from('generated_books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (fetchError || !book) {
            console.error("❌ Book lookup failed:", fetchError);
            return NextResponse.json({ error: "Book not found" }, { status: 404 });
        }

        // Validate Content
        if (!book.pages || !Array.isArray(book.pages)) {
            console.error("❌ Invalid book content structure");
            return NextResponse.json({ error: "Invalid content" }, { status: 400 });
        }

        const pages = book.pages;
        const photoUrl = book.child_photo_url;
        const childGender = book.child_gender; // 'boy' or 'girl'

        let updatedPages = [...pages];
        let hasChanges = false;
        let generatedCount = 0;

        // [INSERTED FIX] 0. Handle Cover Personalization Explicitly
        // Normalize cover URL key
        let currentCoverUrl = book.cover_image_url || book.cover_url;

        if (currentCoverUrl && photoUrl && !currentCoverUrl.includes('fal')) {
            console.log("🎨 Personalizing Cover Template...");
            try {
                const coverSwap = await fal.subscribe("fal-ai/face-swap", {
                    input: {
                        base_image_url: currentCoverUrl,
                        swap_image_url: photoUrl
                    },
                    logs: true,
                });
                if (coverSwap.images?.[0]?.url) {
                    console.log("✅ Cover Swapped Successfully!");
                    // Update the book object in memory immediately so we don't overwrite it later
                    currentCoverUrl = coverSwap.images[0].url;

                    // We must save this update to DB immediately or add to a "pending updates" object
                    // The loop below tracks "hasChanges". Let's assume we will save at the end.
                    hasChanges = true;
                }
            } catch (err) {
                console.error("❌ Cover Swap Failed:", err);
            }
        }

        // 2. PIVOT V1 LOOP: Pure Face Swap
        // We iterate through pages and strictly apply Face Swap to the base_image_url
        for (let i = 0; i < updatedPages.length; i++) {
            const page = updatedPages[i];

            // Safety: Skip if already has a valid final image (e.g. from Preview)
            // But for Pivot V1, we trust the process: if it's not a swap url (fal.media), we might want to swap it.
            // Let's stick to standard safety: if it looks like a finished url, skip.
            const hasValidImage = page.image && page.image.length > 50 && page.image.startsWith('https://fal.media');
            if (hasValidImage) {
                console.log(`✅ Page ${i + 1} already has valid image. Skipping.`);
                continue;
            }

            const baseImageUrl = page.base_image_url;

            if (!baseImageUrl) {
                console.warn(`⚠️ Page ${i + 1} has NO base_image_url. Skipping.`);
                // In a perfect world we would fallback to Flux here, but for Pivot V1 we want to fail loudly or just show placeholder
                // to force data quality.
                continue;
            }

            console.log(`🎭 Processing Page ${i + 1}...`);
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
                    const swapImages = swapResult.images || swapResult.data?.images;
                    if (swapImages?.[0]?.url) {
                        finalImageUrl = swapImages[0].url;
                        console.log(`> Swapped successfully.`);
                    } else {
                        throw new Error("Face swap returned no image");
                    }
                } else {
                    console.log(`> No user photo. Using base image.`);
                }

                updatedPages[i] = {
                    ...page,
                    image: finalImageUrl // Set the final image
                };
                hasChanges = true;
                generatedCount++;

            } catch (err) {
                console.error(`❌ Failed to process Page ${i + 1}:`, err);
                // Keep base image as fallback so book isn't broken
                updatedPages[i] = { ...page, image: baseImageUrl };
                hasChanges = true;
            }
        }

        // 3. Save Context & Send Email
        if (hasChanges) {
            // Determine Cover Image if missing
            let updates = {
                pages: updatedPages,
                status: 'completed',
                // cover_image_url removed to avoid 500 error
            };

            // Legacy Fallback (Only if we STILL don't have a personalized cover)
            const isCoverPersonalized = currentCoverUrl && (currentCoverUrl.includes('fal.media') || currentCoverUrl.includes('fal.ai'));

            if (!currentCoverUrl && updatedPages.length > 0 && updatedPages[0].image) {
                // Fallback for missing cover ENTIRELY
                console.log("🖼️ Setting missing cover image from Page 1 (Skipped saving to DB)");
                // updates.cover_image_url = updatedPages[0].image;
            }
            // Removed the aggressive "overwrite static cover" logic since we now handle it explicitly at start.

            const { error: updateError } = await supabase
                .from('generated_books')
                .update(updates)
                .eq('id', bookId);

            if (updateError) {
                console.error("❌ Failed to update book in DB:", updateError);
                return NextResponse.json({ error: "DB Update Failed" }, { status: 500 });
            }
            console.log("💾 Book updated successfully with new images.");

            // 4. Send Email Notification
            if (book.email) {
                console.log(`📧 Sending ready email to ${book.email}...`);
                try {
                    const emailHtml = BookReadyEmail({
                        childName: book.child_name || 'votre enfant',
                        bookTitle: book.title,
                        previewUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kusomakids.com'}/book/${book.id}/preview`
                    });

                    const emailRes = await sendEmail({
                        to: book.email,
                        from: SENDERS.TREASURE, // Updated Sender
                        subject: `L'histoire de ${book.child_name || 'votre enfant'} est prête ! 📖✨`,
                        html: emailHtml
                    });

                    if (emailRes.success) {
                        console.log("✅ Email sent successfully.");
                    } else {
                        console.error("⚠️ Email warning:", emailRes.error);
                    }
                } catch (emailErr) {
                    console.error("❌ Email sending failed:", emailErr);
                }
            } else {
                console.log("⚠️ No email found for this book. Skipping notification.");
            }

        } else {
            console.log("🤷‍♂️ No changes made (all pages were already present).");
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
