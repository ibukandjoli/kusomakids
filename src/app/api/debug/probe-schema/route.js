
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// Force dynamic
export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = await createClient();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createClient: createAdmin } = require('@supabase/supabase-js');
    const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, { auth: { persistSession: false } });

    const results = {};

    // 1. Try Base Insert (Just Pages)
    // We already know 'pages' works (or at least replaced content_json).
    // Let's verify 'pages' first.
    try {
        const { error } = await admin.from('generated_books').insert({
            user_id: '00000000-0000-0000-0000-000000000000', // Mock
            title: 'Probe Book',
            pages: [], // Valid jsonb/array
            // No cover column
        }).select('id').single();

        if (error) results.pages_only = error.message;
        else results.pages_only = "SUCCESS";
    } catch (e) { results.pages_only = e.message; }

    // 2. Try 'cover_url'
    try {
        const { error } = await admin.from('generated_books').insert({
            user_id: '00000000-0000-0000-0000-000000000000',
            title: 'Probe Book CoverUrl',
            pages: [],
            cover_url: 'http://test.com'
        }).select('id').single();

        if (error) results.cover_url = error.message;
        else results.cover_url = "SUCCESS";
    } catch (e) { results.cover_url = e.message; }

    // 3. Try 'cover_image_url'
    try {
        const { error } = await admin.from('generated_books').insert({
            user_id: '00000000-0000-0000-0000-000000000000',
            title: 'Probe Book CoverImageUrl',
            pages: [],
            cover_image_url: 'http://test.com'
        }).select('id').single();

        if (error) results.cover_image_url = error.message;
        else results.cover_image_url = "SUCCESS";
    } catch (e) { results.cover_image_url = e.message; }

    // 4. Try 'cover_image'
    try {
        const { error } = await admin.from('generated_books').insert({
            user_id: '00000000-0000-0000-0000-000000000000',
            title: 'Probe Book CoverImage',
            pages: [],
            cover_image: 'http://test.com'
        }).select('id').single();

        if (error) results.cover_image = error.message;
        else results.cover_image = "SUCCESS";
    } catch (e) { results.cover_image = e.message; }

    // 5. Try 'cover'
    try {
        const { error } = await admin.from('generated_books').insert({
            user_id: '00000000-0000-0000-0000-000000000000',
            title: 'Probe Book Cover',
            pages: [],
            cover: 'http://test.com'
        }).select('id').single();

        if (error) results.cover = error.message;
        else results.cover = "SUCCESS";
    } catch (e) { results.cover = e.message; }

    return NextResponse.json(results);
}
