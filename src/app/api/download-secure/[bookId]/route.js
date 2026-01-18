import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { renderToStream, Document, Page, Text, Image, View, StyleSheet } from '@react-pdf/renderer';

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

// PDF Styles - Landscape format for children's book
const styles = StyleSheet.create({
    page: {
        flexDirection: 'row', // Side by side layout
        backgroundColor: '#FFFFFF',
        padding: 0
    },
    coverPage: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FDFBF7',
        padding: 60,
        height: '100%'
    },
    coverImage: {
        width: '80%',
        height: 400,
        objectFit: 'contain',
        marginBottom: 40,
        borderRadius: 15
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
        color: '#1a1a1a',
        fontFamily: 'Helvetica-Bold' // Child-friendly
    },
    subtitle: {
        fontSize: 22,
        textAlign: 'center',
        color: '#666666',
        marginBottom: 25,
        fontFamily: 'Helvetica'
    },
    // Story page - split layout
    imageSection: {
        width: '50%',
        height: '100%',
        backgroundColor: '#F8F8F8',
        padding: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    textSection: {
        width: '50%',
        height: '100%',
        padding: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF'
    },
    storyImage: {
        width: '100%',
        maxHeight: '90%',
        objectFit: 'contain',
        borderRadius: 12
    },
    storyText: {
        fontSize: 18,
        lineHeight: 1.8,
        color: '#2d2d2d',
        textAlign: 'left',
        fontFamily: 'Helvetica' // Readable for children
    },
    pageNumber: {
        position: 'absolute',
        bottom: 20,
        right: 30,
        fontSize: 14,
        color: '#999999',
        fontFamily: 'Helvetica'
    }
});

const BookDocument = ({ book }) => {
    const rawContent = book.story_content || {};
    const pages = Array.isArray(rawContent) ? rawContent : (rawContent.pages || []);

    const formattedTitle = (book.title || "Histoire Personnalisée")
        .replace(/\{childName\}|\[Son prénom\]/gi, book.child_name || 'Votre enfant');

    return (
        <Document>
            {/* COVER PAGE - Portrait */}
            <Page size="A4" orientation="portrait" style={styles.coverPage}>
                <Text style={styles.title}>{formattedTitle}</Text>
                <Text style={styles.subtitle}>Une histoire pour {book.child_name}</Text>

                {book.cover_image_url && (
                    <Image src={book.cover_image_url} style={styles.coverImage} />
                )}

                <Text style={{ marginTop: 60, fontSize: 14, color: '#999' }}>KusomaKids - Créateur d'Histoires Magiques</Text>
            </Page>

            {/* STORY PAGES - Landscape with side-by-side layout */}
            {pages.map((page, index) => (
                <Page key={index} size="A4" orientation="landscape" style={styles.page}>
                    {/* LEFT: Image */}
                    <View style={styles.imageSection}>
                        {page.image && (
                            <Image src={page.image} style={styles.storyImage} />
                        )}
                    </View>

                    {/* RIGHT: Text */}
                    <View style={styles.textSection}>
                        <Text style={styles.storyText}>{page.text}</Text>
                        <Text style={styles.pageNumber}>{index + 1}</Text>
                    </View>
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
