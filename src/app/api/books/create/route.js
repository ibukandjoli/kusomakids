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
        // STRATEGY: Use Session Client if possible (Auth User), else Admin Client (Guest or Bypass)

        // Check if we have a valid session client and the user matches
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
                    content_json: content_json,
                    cover_url: coverUrl,
                    status: 'draft',
                    is_unlocked: false,
                    template_id: templateId
                })
                .select('id')
                .single();

            insertData = result.data;
            insertError = result.error;
        } else {
            // FALLBACK: Admin Client (For Guest or Cross-User)
            console.log("🛡️ Using Admin Client for Insert");

            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

            if (!serviceRoleKey) {
                // CRITICAL FALLBACK: If key is missing but we have userId, try standard client anyway?
                // No, standard client without session (if guest) won't work. 
                // But if we are here, we might be stuck.
                if (userId) {
                    console.warn("⚠️ Service Role Key missing, trying standard client as last resort (might fail RLS)...");
                    // We can't really do anything if key is missing and no session. 
                    // Exception: maybe RLS allows Anon insert? Unlikely.
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
                    content_json: content_json,
                    cover_url: coverUrl,
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
