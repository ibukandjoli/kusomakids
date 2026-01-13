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
        const {
            title,
            childName,
            childAge,
            childGender,
            childPhotoUrl,
            content_json,
            coverUrl,
            templateId
        } = body;

        // Insert into generated_books
        const { data, error } = await supabase
            .from('generated_books')
            .insert({
                user_id: session.user.id,
                title: title || 'Mon Aventure',
                child_name: childName,
                child_age: childAge,
                child_gender: childGender,
                child_photo_url: childPhotoUrl,
                content_json: content_json,
                cover_url: coverUrl,
                status: 'draft',
                is_unlocked: false,
                template_id: templateId
            })
            .select('id')
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, bookId: data.id });

    } catch (err) {
        console.error('Create Book API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
