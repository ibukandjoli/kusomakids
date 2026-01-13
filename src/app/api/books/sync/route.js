import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(req) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { guestBooks } = body;

        if (!guestBooks || !Array.isArray(guestBooks) || guestBooks.length === 0) {
            return NextResponse.json({ success: true, message: 'Nothing to sync' });
        }

        const userId = session.user.id;
        const results = [];

        for (const book of guestBooks) {
            // Check if already exists? (Optional, by title/child?)
            // For now, simple insert. We assume guest books are new drafts.

            // Map guest book structure (from localStorage cart_item format) to DB
            // Expected LocalFormat: { bookId (template?), bookTitle, personalization: { ... }, finalizedPages: [] }

            const payload = {
                user_id: userId,
                title: book.bookTitle,
                child_name: book.personalization?.childName,
                child_age: book.personalization?.age,
                child_gender: book.personalization?.gender,
                child_photo_url: book.personalization?.photoUrl,
                content_json: book.finalizedPages || [], // Might be empty if just started
                cover_url: book.coverUrl,
                status: 'draft',
                template_id: book.bookId // Assuming bookId in local was Template ID
            };

            const { data, error } = await supabase
                .from('generated_books')
                .insert(payload)
                .select('id')
                .single();

            if (error) {
                console.error("Sync Error for book:", book.bookTitle, error);
            } else {
                results.push(data.id);
            }
        }

        return NextResponse.json({ success: true, syncedCount: results.length });

    } catch (err) {
        console.error("Sync API Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
