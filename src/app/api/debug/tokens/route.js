import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const bookId = searchParams.get('bookId');

    try {
        // Check if table exists
        const { data: tables, error: tableError } = await supabaseAdmin
            .from('download_tokens')
            .select('*')
            .limit(5);

        if (tableError) {
            return NextResponse.json({
                error: "Table error",
                details: tableError,
                message: tableError.message
            });
        }

        // If token provided, check specific token
        if (token && bookId) {
            const { data: tokenData, error: tokenError } = await supabaseAdmin
                .from('download_tokens')
                .select('*')
                .eq('token', token)
                .eq('book_id', bookId)
                .single();

            return NextResponse.json({
                success: true,
                tokenProvided: token.substring(0, 20) + '...',
                bookIdProvided: bookId,
                tokenFound: !!tokenData,
                tokenData: tokenData,
                tokenError: tokenError,
                allTokens: tables
            });
        }

        // Otherwise show all tokens
        return NextResponse.json({
            success: true,
            totalTokens: tables?.length || 0,
            tokens: tables?.map(t => ({
                id: t.id,
                book_id: t.book_id,
                token: t.token.substring(0, 20) + '...',
                email: t.email,
                downloads_remaining: t.downloads_remaining,
                expires_at: t.expires_at,
                created_at: t.created_at
            }))
        });

    } catch (err) {
        return NextResponse.json({
            error: "Exception",
            message: err.message,
            stack: err.stack
        });
    }
}
