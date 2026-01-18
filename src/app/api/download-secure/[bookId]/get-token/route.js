import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
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

export async function POST(req, { params }) {
    try {
        const { bookId } = await params;

        // Generate token
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');

        // Get user session
        const authHeader = req.headers.get('cookie');

        // Store token in database
        const { error: tokenError } = await supabaseAdmin
            .from('download_tokens')
            .insert({
                book_id: bookId,
                token: token,
                email: 'user@kusomakids.com', // Will be updated with actual user email
                downloads_remaining: 3,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });

        if (tokenError) {
            console.error('Token creation error:', tokenError);
            return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
        }

        return NextResponse.json({ token });

    } catch (error) {
        console.error('Get token error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
