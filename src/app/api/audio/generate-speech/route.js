import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Admin Client (Bypass RLS)
const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(req) {
    console.log("🔊 TTS: Received Audio Generation Request");

    try {
        const supabase = await createClient();

        // 1. Auth Check (Standard Client)
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

        // 2. Fetch Book (Standard Client - ensures RLS & Ownership)
        const { data: book, error: fetchError } = await supabase
            .from('generated_books')
            .select('user_id, content_json, story_content')
            .eq('id', bookId)
            .single();

        if (fetchError || !book) {
            console.error(`❌ Book not found or access denied: ${bookId}`, fetchError || "No book returned");
            return NextResponse.json({ error: "Book not found or access denied", details: fetchError }, { status: 404 });
        }

        // 3. OpenAI TTS Generation
        const mp3 = await openai.audio.speech.create({
            model: "tts-1-hd",
            voice: voice,
            input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        // 4. Upload to Supabase Storage (Admin Client)
        const fileName = `${bookId}/${pageIndex}_${Date.now()}.mp3`;
        const bucketName = 'book-audio';

        // Ensure bucket exists
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        const bucketExists = buckets?.some(b => b.name === bucketName);

        if (!bucketExists) {
            // Secure by default: public: false
            const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, { public: false });
            if (createError) console.error("Could not create bucket:", createError);
        }

        const { data: uploadData, error: uploadError } = await supabaseAdmin
            .storage
            .from(bucketName)
            .upload(fileName, buffer, {
                contentType: 'audio/mpeg',
                upsert: true
            });

        if (uploadError) {
            console.error("❌ Storage Upload Failed:", uploadError);
            // If the upload failed, it might be due to missing bucket or invalid admin key
            if (uploadError.message.includes("Bucket not found")) {
                return NextResponse.json({ error: "Bucket 'book-audio' introuvable. Veuillez le créer dans Supabase." }, { status: 500 });
            }
            return NextResponse.json({ error: "Storage upload failed", details: uploadError.message }, { status: 500 });
        }

        // 5. Get Signed URL (bucket is private, so getPublicUrl won't work)
        const { data: signedData, error: signedError } = await supabaseAdmin
            .storage
            .from(bucketName)
            .createSignedUrl(fileName, 3600); // 1 hour expiry

        const audioUrl = signedData?.signedUrl;

        if (signedError || !audioUrl) {
            console.error("❌ Failed to create signed URL:", signedError);
            return NextResponse.json({ error: "Failed to get audio URL" }, { status: 500 });
        }

        // 6. Update Book Data (Cache the file path for future use)
        let content = book.story_content || book.content_json || {};
        let contentPages = Array.isArray(content) ? content : (content.pages || []);

        if (contentPages[pageIndex]) {
            contentPages[pageIndex].audio_url = fileName; // Store path, not full URL

            let newContent = Array.isArray(content) ? contentPages : { ...content, pages: contentPages };
            const updatePayload = book.story_content ? { story_content: newContent } : { content_json: newContent };

            const { error: updateError } = await supabaseAdmin
                .from('generated_books')
                .update(updatePayload)
                .eq('id', bookId);

            if (updateError) console.error("⚠️ Failed to cache audio path:", updateError);
        }

        console.log("✅ Audio Generated:", fileName);

        return NextResponse.json({
            success: true,
            audioUrl: audioUrl,
            filePath: fileName
        });

    } catch (error) {
        console.error("🚨 TTS Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
