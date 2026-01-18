import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
    console.log("🔊 TTS: Received Audio Generation Request");

    try {
        const supabase = await createClient();

        // 1. Auth Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { text, bookId, pageIndex, voice = 'nova' } = body;

        if (!text || !bookId) {
            return NextResponse.json({ error: "Missing text or bookId" }, { status: 400 });
        }

        console.log(`🎙️ Generating Audio for Book ${bookId}, Page ${pageIndex}`);

        // 2. Security: Verify User Owns Book (or is Admin/Club)
        // Ideally we check if book belongs to user.
        const { data: book } = await supabase.from('generated_books').select('user_id, content_json, story_content').eq('id', bookId).single();
        if (!book || book.user_id !== user.id) {
            // Strict ownership check. (Allow admins later if needed)
            return NextResponse.json({ error: "Book not found or access denied" }, { status: 403 });
        }

        // 3. OpenAI TTS Generation
        const mp3 = await openai.audio.speech.create({
            model: "tts-1-hd",
            voice: voice,
            input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        // 4. Upload to Supabase Storage
        const fileName = `${bookId}/${pageIndex}_${Date.now()}.mp3`;
        const bucketName = 'book-audio';

        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from(bucketName)
            .upload(fileName, buffer, {
                contentType: 'audio/mpeg',
                upsert: true
            });

        if (uploadError) {
            console.error("❌ Storage Upload Failed:", uploadError);
            // If bucket doesn't exist, this fails. 
            // We assume bucket 'book-audio' exists and is public.
            return NextResponse.json({ error: "Storage upload failed" }, { status: 500 });
        }

        // 5. Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from(bucketName)
            .getPublicUrl(fileName);

        // 6. Update Book Data (Cache the URL)
        // Check for story_content (standard) or content_json (legacy)
        let content = book.story_content || book.content_json || {};
        let pages = Array.isArray(content) ? content : (content.pages || []);

        // Ensure pageIndex is valid
        if (pages[pageIndex]) {
            pages[pageIndex].audio_url = publicUrl;

            // Reconstruct content to save back
            let newContent = Array.isArray(content) ? pages : { ...content, pages: pages };

            // Update column dynamically (prefer story_content)
            const updatePayload = book.story_content ? { story_content: newContent } : { content_json: newContent };

            const { error: updateError } = await supabase
                .from('generated_books')
                .update(updatePayload)
                .eq('id', bookId);

            if (updateError) console.error("⚠️ Failed to cache audio URL:", updateError);
        }

        console.log("✅ Audio Generated & Cached:", publicUrl);

        return NextResponse.json({
            success: true,
            audioUrl: publicUrl
        });

    } catch (error) {
        console.error("🚨 TTS Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
