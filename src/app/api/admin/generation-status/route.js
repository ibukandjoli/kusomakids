import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * Admin Dashboard - View Generation Status
 * GET /api/admin/generation-status?bookId=xxx
 */
export async function GET(req) {
    try {
        const supabase = await createClient();

        // Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const bookId = searchParams.get('bookId');

        if (bookId) {
            // Get specific book status
            const { data, error } = await supabase
                .from('generated_books')
                .select('id, title, generation_status, generation_started_at, generation_completed_at, generation_error, images_generated_count, created_at')
                .eq('id', bookId)
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 404 });
            }

            return NextResponse.json({ book: data });
        } else {
            // Get all books with their status
            const { data, error } = await supabase
                .from('generated_books')
                .select('id, title, child_name, generation_status, generation_started_at, generation_completed_at, images_generated_count, created_at')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            // Group by status
            const stats = {
                total: data.length,
                pending: data.filter(b => b.generation_status === 'pending').length,
                processing: data.filter(b => b.generation_status === 'processing').length,
                completed: data.filter(b => b.generation_status === 'completed').length,
                failed: data.filter(b => b.generation_status === 'failed').length
            };

            return NextResponse.json({ books: data, stats });
        }

    } catch (error) {
        console.error("Status check error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
