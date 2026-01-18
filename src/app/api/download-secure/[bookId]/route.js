import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { renderToStream, Document, Page, Text, Image, StyleSheet } from '@react-pdf/renderer';

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

// PDF Styles (same as existing download endpoint)
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40
    },
    coverPage: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FDFBF7',
        padding: 40,
        height: '100%'
    },
    coverImage: {
        width: '100%',
        height: 400,
        objectFit: 'contain',
        marginBottom: 30,
        borderRadius: 10
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#1a1a1a'
    },
    subtitle: {
        fontSize: 18,
        textAlign: 'center',
        color: '#666666',
        marginBottom: 20
    },
    storyPage: {
        padding: 40,
        flexDirection: 'column'
    },
    storyImage: {
        width: '100%',
        height: 300,
        objectFit: 'cover',
        marginBottom: 30,
        borderRadius: 8
    },
    storyText: {
        fontSize: 14,
        lineHeight: 1.6,
        color: '#333333',
        textAlign: 'justify'
    },
    pageNumber: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 10,
        color: '#999999'
    }
});

const BookDocument = ({ book }) => {
    const rawContent = book.story_content || {};
    const pages = Array.isArray(rawContent) ? rawContent : (rawContent.pages || []);

    const formattedTitle = (book.title || "Histoire Personnalisée")
        .replace(/\{childName\}|\[Son prénom\]/gi, book.child_name || 'Votre enfant');

    return (
        <Document>
            {/* COVER PAGE */}
            <Page size="A4" style={styles.coverPage}>
                <Text style={styles.title}>{formattedTitle}</Text>
                <Text style={styles.subtitle}>Une aventure pour {book.child_name}</Text>

                {book.cover_image_url && (
                    <Image src={book.cover_image_url} style={styles.coverImage} />
                )}

                <Text style={{ marginTop: 50, fontSize: 12, color: '#999' }}>KusomaKids - Histoires Magiques</Text>
            </Page>

            {/* STORY PAGES */}
            {pages.map((page, index) => (
                <Page key={index} size="A4" style={styles.storyPage}>
                    {page.image && (
                        <Image src={page.image} style={styles.storyImage} />
                    )}
                    <Text style={styles.storyText}>{page.text}</Text>

                    <Text style={styles.pageNumber}>{index + 1}</Text>
                </Page>
            ))}
        </Document>
    );
};

export async function GET(req, { params }) {
    const { bookId } = await params; // Fix: await params in Next.js 15
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    console.log(`📥 Secure download request: bookId=${bookId}, token=${token?.substring(0, 10)}...`);

    // 1. Validate token parameter
    if (!token) {
        return NextResponse.json({ error: "Missing download token" }, { status: 400 });
    }

    try {
        // 2. Fetch and validate token
        console.log('🔍 Searching for token in database...');
        console.log('   Token (first 20 chars):', token?.substring(0, 20));
        console.log('   Token length:', token?.length);
        console.log('   Book ID:', bookId);

        const { data: tokenData, error: tokenError } = await supabaseAdmin
            .from('download_tokens')
            .select('*')
            .eq('token', token)
            .eq('book_id', bookId)
            .single();

        console.log('📊 Query result:', {
            found: !!tokenData,
            error: tokenError?.message,
            tokenDataId: tokenData?.id
        });

        if (tokenError || !tokenData) {
            console.error("❌ Invalid token:", tokenError);

            // Try to find ANY token for this book to help debug
            const { data: anyTokens } = await supabaseAdmin
                .from('download_tokens')
                .select('id, token, book_id')
                .eq('book_id', bookId)
                .limit(1);

            console.log('🔎 Debug - Tokens for this book:', anyTokens?.map(t => ({
                id: t.id,
                tokenMatch: t.token === token,
                tokenLengthDB: t.token.length,
                tokenLengthProvided: token?.length
            })));

            return NextResponse.json({ error: "Invalid or expired download link" }, { status: 403 });
        }

        // 3. Check expiration
        if (new Date(tokenData.expires_at) < new Date()) {
            console.error("❌ Token expired:", tokenData.expires_at);
            return NextResponse.json({ error: "Download link has expired" }, { status: 403 });
        }

        // 4. Check downloads remaining
        if (tokenData.downloads_remaining <= 0) {
            console.error("❌ No downloads remaining");
            return NextResponse.json({ error: "Download limit reached" }, { status: 403 });
        }

        // 5. Fetch book data
        const { data: book, error: bookError } = await supabaseAdmin
            .from('generated_books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (bookError || !book) {
            console.error("❌ Book not found:", bookError);
            return NextResponse.json({ error: "Book not found" }, { status: 404 });
        }

        // 6. Decrement downloads_remaining
        const { error: updateError } = await supabaseAdmin
            .from('download_tokens')
            .update({ downloads_remaining: tokenData.downloads_remaining - 1 })
            .eq('id', tokenData.id);

        if (updateError) {
            console.error("⚠️ Failed to update token:", updateError);
        } else {
            console.log(`✅ Downloads remaining: ${tokenData.downloads_remaining - 1}`);
        }

        // 7. Generate PDF
        const stream = await renderToStream(<BookDocument book={book} />);

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="kusomakids-${book.child_name || 'story'}.pdf"`,
            },
        });

    } catch (err) {
        console.error("❌ Secure download error:", err);
        return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
    }
}
