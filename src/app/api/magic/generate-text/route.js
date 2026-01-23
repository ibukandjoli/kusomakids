import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase Admin (needed to check subscriptions securely/bypass RLS if needed, though user client is better for auth)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const maxDuration = 60; // Allow 60 seconds for LLM

export async function POST(req) {
    try {
        const { userPrompt, childName, childAge, childGender, childPhotoUrl } = await req.json();

        // 1. Authenticate User
        // We expect the request to carry the user's session token or we assume the client is authenticated
        // But since this is a server route, we should verify the user. 
        // For simplicity in this project structure (Next.js App Router), we often use supabase-ssr or just verify headers.
        // However, to keep it simple and robust: we'll check the Authorization header if sent, 
        // or rely on the client ensuring they are logged in. Ideally, we verify the token.
        // For this implementation, let's assume we receive a strict validation via the frontend, 
        // but better: Let's use the Service Role to strictly check the user's ID passed in, OR verify the session.
        // Given the context, we'll try to get the user from the Supabase client if possible, or expect `userId` in body (secured by RLS on insert).
        // Actually, best practice: getUser from auth header.

        // Simplification for speed: We'll accept userId in body, and strict check subscription.
        // SECURITY NOTE: In production, rely on `supabase.auth.getUser()` with the request cookies/headers.
        // For now, we will trust the `userId` but VERIFY subscription status using Admin.

        // Better approach matching project style:
        // We'll read the 'Authorization' header to get the JWT.
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        // 2. Check Club Subscription
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('subscription_status')
            .eq('id', user.id)
            .single();

        if (profileError || profile?.subscription_status !== 'active') {
            return NextResponse.json(
                { error: 'Subscription required. Please update your plan.' },
                { status: 403 }
            );
        }

        // 3. Generate Story with OpenAI
        const systemPrompt = `
      You are an expert children's book author for African children living in modern metropolises (major capital cities).
      Create a 10 - page personalized story for a child based on the User's Idea.
      
      Target Audience: ${childAge} years old.
            Language: French.
                Tone: Magical, engaging, educational.
      
      IMPORTANT SETTING RULES:
        - AVOID CLICHÉS: Do NOT set the story in a "village", "hut", or "savanna" unless explicitly asked.
      - DEFAULT SETTINGS: Modern house, city apartment, school, park, playground, bedroom, library, mall.
      - The child should wear modern, colorful clothing(t - shirts, jeans, dresses, sneakers) unless a costume is part of the plot.
      
      Output MUST be valid JSON with this structure:
        {
            "title": "Story Title",
                "description": "Short summary",
                    "pages": [
                        {
                            "page_number": 1,
                            "text": "Story text for page 1 (approx 3-4 sentences, ~50 words). Rich, descriptive and engaging narrative.",
                            "image_prompt": "Detailed AI image prompt describing the scene visually. Style: detailed 2D vector illustration, colorful, cute. Include visual description of ${childName}."
                        },
                        ... (up to page 10)
                    ]
        }
        `;

        const userMessage = `
      User Idea: "${userPrompt}"
      Child Name: ${childName}
        Gender: ${childGender}
        Age: ${childAge}
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
            ],
            response_format: { type: "json_object" },
        });

        const storyContent = JSON.parse(completion.choices[0].message.content);

        // 4. Save Draft to Database
        const { data: book, error: insertError } = await supabaseAdmin
            .from('generated_books')
            .insert({
                user_id: user.id,
                child_name: childName,
                child_age: childAge,
                gender: childGender,
                story_content: storyContent, // Saves the whole JSON structure
                is_custom_story: true,
                user_prompt: userPrompt,
                generation_status: 'draft_text', // New status for "Text Ready, Images Pending"
                is_unlocked: true, // Club members get it unlocked? Or waiting? Let's say Unlocked because included.
                // We'll store the photo URL in metadata or handle it in the image gen phase. 
                // For now, we need to pass it to the next step. 
                // Let's store it in `story_content` metadata? Or a transient field?
                // Actually, let's look at `generated_books` schema. No photo_url column?
                // Let's check `story_content`. It's JSONB. We can add it there.
            })
            .select()
            .single();

        if (insertError) {
            console.error('DB Insert Error:', insertError);
            return NextResponse.json({ error: 'Failed to save story' }, { status: 500 });
        }

        // If we have a photo URL, update the story_content to include it for reference later
        if (childPhotoUrl) {
            const updatedContent = { ...storyContent, reference_image: childPhotoUrl };
            await supabaseAdmin
                .from('generated_books')
                .update({ story_content: updatedContent })
                .eq('id', book.id);
        }

        return NextResponse.json({ bookId: book.id, story: storyContent });

    } catch (error) {
        console.error('Story Generation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
