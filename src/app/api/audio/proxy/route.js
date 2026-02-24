import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Admin Client to bypass RLS
// Initialize Admin Client to bypass RLS (for storage only)
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

import { createClient as createServerClient } from '@/lib/supabase-server';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const audioUrl = searchParams.get('url');

    if (!audioUrl) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    try {
        // 1. Authenticate User
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse URL or Path to get Book ID
        // Handles both absolute URLs and relative paths (e.g. "book-123/page-1.mp3")
        let filePath = audioUrl;

        if (filePath.startsWith('http')) {
            try {
                const urlObj = new URL(filePath);
                const pathParts = urlObj.pathname.split('/book-audio/');
                if (pathParts.length > 1) {
                    filePath = pathParts[1];
                } else {
                    return NextResponse.json({ error: "Invalid URL structure" }, { status: 400 });
                }
            } catch (e) {
                return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
            }
        }

        if (!filePath || !filePath.includes('/')) {
            return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
        }

        const bookId = filePath.split('/')[0]; // Extract "book-123" (which is actually the UUID)

        // 3. Verify Ownership
        const { data: book, error: bookError } = await supabase
            .from('generated_books')
            .select('user_id')
            .eq('id', bookId)
            .single();

        if (bookError || !book) {
            return NextResponse.json({ error: "Book not found or access denied" }, { status: 404 });
        }

        if (book.user_id !== user.id) {
            // Strict IDOR Check
            console.error(`🚨 IDOR Attempt: User ${user.id} tried accessing book ${bookId}`);
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 4. Secure Download (Admin)
        const { data, error } = await supabaseAdmin
            .storage
            .from('book-audio')
            .download(filePath);

        if (error) {
            console.error("Supabase Download Error:", error);
            return NextResponse.json({ error: 'Audio not found' }, { status: 404 });
        }

        // 5. Stream Response
        return new NextResponse(data, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'private, max-age=3600' // Private cache only
            }
        });

    } catch (error) {
        console.error("Proxy Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
