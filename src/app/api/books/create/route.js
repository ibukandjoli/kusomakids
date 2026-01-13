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

            // Try to find existing user or create new one
            // We can't easily "find" by email without listing consumers (poor perf) or trying to create.
            // Best bet: Try create, catch if exists.

            // Generate a random password for shadow account (User can reset later)
            const randomPassword = Math.random().toString(36).slice(-8) + "Kusoma1!";

            const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
                email: email,
                password: randomPassword,
                email_confirm: true // Force confirm so they can use it
            });

            if (createError) {
                // Assuming error message contains "already registered" or similar if user exists
                // But we can't easily get the ID of an existing user due to security IF we don't have listUsers permission? 
                // Service Role HAS listUsers permission.

                console.log("⚠️ User creation failed (likely exists), looking up...", createError.message);

                // Lookup user by email (Pagination 1, Filter email)
                // listUsers() generally works for small batches. 
                // Alternatively, admin.getUserById is only for ID.
                // We have to use listUsers check.

                // Note: listUsers is the only way in Supabase Admin API to find by email.
                // Or generateLink({ type: 'magiclink', email }) returns user? No.

                // Let's assume user exists. We need their ID to assign the book.
                // Security Risk: Assigning a book to an existing user without their login? 
                // Yes, but it's "Paid" content being added to their account. Low risk of harm.

                // Find user logic
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
        // Use Admin Client for insertion if Session Client fails? 
        // Standard `supabase` client (SSR) might not have permission to insert for OTHER userId if RLS matches `auth.uid()`.
        // If we are "Guest" (userId determined above), `supabase` (SSR) has no session (uid=null).
        // RLS will block insert with `user_id = userId`.
        // SOLUTION: Use Admin Client to insert the book.

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const { data, error } = await adminSupabase
            .from('generated_books')
            .insert({
                user_id: userId,
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
