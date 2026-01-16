import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(req) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        let userId = session?.user?.id;
        const body = await req.json();

        // GUEST CHECKOUT LOGIC
        if (!userId) {
            if (!body.email) {
                return NextResponse.json({ error: 'Unauthorized: Please login or provide email' }, { status: 401 });
            }

            // Create/Find User via Admin Client (Service Role)
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

            if (!serviceRoleKey) {
                console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY for guest checkout");
                return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
            }

            const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });

            const email = body.email;

            // Generate a random password for shadow account
            const randomPassword = Math.random().toString(36).slice(-8) + "Kusoma1!";

            const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
                email: email,
                password: randomPassword,
                email_confirm: true
            });

            if (createError) {
                console.log("⚠️ User creation failed (likely exists), looking up...", createError.message);
                const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers();
                if (listError) throw listError;

                const foundUser = usersData.users.find(u => u.email === email);
                if (foundUser) {
                    userId = foundUser.id;
                } else {
                    throw new Error("Could not create or find user for guest checkout");
                }
            } else {
                userId = newUser.user.id;
                console.log("✅ Created Guest User:", userId);
            }
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
                    pages: content_json, // Corrected Column Name
                    // cover_image_url removed to avoid schema error
                    status: 'draft',
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
                    pages: content_json, // Corrected Column Name
                    // cover_image_url removed to avoid schema error
                    status: 'draft',
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
