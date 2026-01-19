import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * Admin endpoint to manually trigger book generation
 * Usage: POST /api/admin/trigger-generation
 * Body: { bookId: string }
 */
export async function POST(req) {
    try {
        const supabase = await createClient();

        // 1. Auth Check - Must be logged in
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Get request body
        const { bookId } = await req.json();
        if (!bookId) {
            return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
        }

        console.log(`🔧 [ADMIN TRIGGER] User ${user.email} triggering generation for book ${bookId}`);

        // 3. Verify book exists
        const { data: book, error: bookError } = await supabase
            .from('generated_books')
            .select('id, title, generation_status')
            .eq('id', bookId)
            .single();

        if (bookError || !book) {
            return NextResponse.json({ error: "Book not found" }, { status: 404 });
        }

        // 4. Call the worker and WAIT for completion
        const workerUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/workers/generate-book`;

        console.log(`📞 Calling worker at: ${workerUrl}`);
        console.log(`⏳ Waiting for worker to complete (may take 60-90 seconds)...`);

        let workerResponse;
        let workerData;

        try {
            workerResponse = await fetch(workerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-trigger-source': 'admin' // Identify source
                },
                body: JSON.stringify({ bookId }),
                // Increase timeout to 5 minutes
                signal: AbortSignal.timeout(300000)
            });

            workerData = await workerResponse.json();

        } catch (fetchError) {
            console.error(`❌ Worker fetch failed:`, fetchError);
            return NextResponse.json({
                error: "Worker connection failed",
                details: fetchError.message,
                bookId,
                hint: "Check if worker endpoint is accessible"
            }, { status: 500 });
        }

        if (!workerResponse.ok) {
            console.error(`❌ Worker returned error:`, workerData);
            return NextResponse.json({
                error: "Worker failed",
                details: workerData,
                status: book.generation_status
            }, { status: 500 });
        }

        console.log(`✅ Worker completed successfully:`, workerData);

        return NextResponse.json({
            success: true,
            message: "Generation completed successfully",
            bookId,
            generatedCount: workerData.generatedCount || 0,
            workerResponse: workerData
        });

    } catch (error) {
        console.error("🚨 Admin Trigger Error:", error);
        return NextResponse.json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
