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

        // 4. Execute generation directly (no HTTP call needed)
        console.log(`🚀 Starting generation for book ${bookId}...`);
        console.log(`⏳ This may take 60-90 seconds...`);

        // Import and execute worker logic directly
        const { executeGeneration } = await import('@/app/api/workers/generate-book/route');
        const result = await executeGeneration(bookId);

        if (!result.success) {
            console.error(`❌ Generation failed:`, result.error);
            return NextResponse.json({
                error: "Generation failed",
                details: result.error,
                bookId
            }, { status: 500 });
        }

        console.log(`✅ Generation completed: ${result.generatedCount} images`);

        return NextResponse.json({
            success: true,
            message: "Generation completed successfully",
            bookId,
            generatedCount: result.generatedCount
        });

    } catch (error) {
        console.error("🚨 Admin Trigger Error:", error);
        return NextResponse.json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
