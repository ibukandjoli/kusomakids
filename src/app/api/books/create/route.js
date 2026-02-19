import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(req) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        let userId = session?.user?.id;
        const body = await req.json();

        // GUEST CHECKOUT DISABLED for security
        // Previously allowed creating accounts for ANY email without verification
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized: Please login first' }, { status: 401 });
        }

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
        // Use 'pages' column instead of 'content_json' based on schema inference

        let insertData, insertError;

        if (session && session.user.id === userId) {
            console.log("💾 Using Session Client for Insert");
            const result = await supabase
                .from('generated_books')
                .insert({
                    user_id: userId,
                    title: title || 'Mon Aventure',
                    child_name: childName,
                    child_age: childAge,
                    child_gender: childGender,
                    child_photo_url: childPhotoUrl,
                    story_content: content_json, // Corrected to match DB schema (jsonb)
                    cover_image_url: coverUrl,
                    is_unlocked: false,
                    template_id: templateId
                })
                .select('id')
                .single();

            insertData = result.data;
            insertError = result.error;
        } else {
            console.log("🛡️ Using Admin Client for Insert");
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

            if (!serviceRoleKey) {
                if (userId) {
                    throw new Error("Server configuration error: Missing Service Role Key");
                }
            }

            const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey, {
                auth: { autoRefreshToken: false, persistSession: false }
            });

            const result = await adminSupabase
                .from('generated_books')
                .insert({
                    user_id: userId,
                    title: title || 'Mon Aventure',
                    child_name: childName,
                    child_age: childAge,
                    child_gender: childGender,
                    child_photo_url: childPhotoUrl,
                    story_content: content_json, // Corrected to match DB schema (jsonb)
                    cover_image_url: coverUrl,
                    is_unlocked: false,
                    template_id: templateId
                })
                .select('id')
                .single();

            insertData = result.data;
            insertError = result.error;
        }

        if (insertError) throw insertError;

        return NextResponse.json({ success: true, bookId: insertData.id });

    } catch (err) {
        console.error('Create Book API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
