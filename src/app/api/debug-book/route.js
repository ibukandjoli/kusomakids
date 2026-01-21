import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    let query = supabase.from('generated_books').select('*');

    if (id) {
        query = query.eq('id', id);
    } else {
        query = query.order('created_at', { ascending: false }).limit(1);
    }

    const { data, error } = await query.single();

    if (error) {
        return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({
        id: data.id,
        created_at: data.created_at,
        title: data.title,
        story_content_title: data.story_content?.title,
        status: data.generation_status,
        pages_count: data.story_content?.pages?.length,
        first_page: data.story_content?.pages?.[0],
        pages_summary: data.story_content?.pages?.map((p, i) => ({
            page: i + 1,
            has_image_prop: !!p.image,
            has_image_url_prop: !!p.image_url,
            image_value: p.image,
            text_preview: p.text?.substring(0, 20)
        }))
    });
}
