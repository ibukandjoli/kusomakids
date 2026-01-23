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

// Font Registration State
let isFontRegistered = false;

async function registerFont() {
    if (isFontRegistered) return true;

    try {
        console.log("🔄 Attempting to register font...");

        // Strategy 1: Fetch from reliable CDN (Raw GitHub)
        // Avoids FS issues in serverless and Redirect issues with some URLs
        const response = await fetch('https://raw.githubusercontent.com/google/fonts/main/apache/chewy/Chewy-Regular.ttf');

        if (!response.ok) {
            throw new Error(`Failed to fetch font: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        Font.register({
            family: 'Chewy',
            src: buffer
        });

        isFontRegistered = true;
        console.log("✅ Font 'Chewy' registered successfully via Fetch.");
        return true;

    } catch (e) {
        console.error("⚠️ Font registration failed (Fetch):", e);

        // Strategy 2: Try Local FS as fallback
        try {
            const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Chewy-Regular.ttf');
            if (fs.existsSync(fontPath)) {
                const fontBuffer = fs.readFileSync(fontPath);
                Font.register({
                    family: 'Chewy',
                    src: fontBuffer
                });
                isFontRegistered = true;
                console.log("✅ Font 'Chewy' registered successfully via FS.");
                return true;
            }
        } catch (fsError) {
            console.error("⚠️ Font registration failed (FS):", fsError);
        }
    }

    return false;
}

// Dynamic Styles Generator
const getStyles = (fontFamily) => StyleSheet.create({
    page: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        padding: 0
    },
    // Cover Page - Landscape Mode
    coverPage: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center', // Center everything vertically
        backgroundColor: '#FFFFFF',
        padding: 0,
        height: '100%',
        width: '100%'
    },
    // Container for the Square Cover (Image + Text Overlay)
    coverContainer: {
        width: 500,
        height: 500,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    coverImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' // Fill the square
    },
    // Text Overlay Styles
    overlayTitle: {
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 32,
        color: '#FFFFFF',
        fontFamily: fontFamily,
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
    },
    overlaySubtitle: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 14,
        color: '#FFFFFF',
        fontFamily: fontFamily,
        textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
    },

    // Story Page Styles
    imageSection: {
        width: '50%',
        height: '100%',
        backgroundColor: '#F8F8F8',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    // Improved Story Image: Square
    storyImageContainer: {
        width: 400,
        height: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EEEEEE'
    },
    storyImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },

    textSection: {
        width: '50%',
        height: '100%',
        padding: 40,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF'
    },
    storyText: {
        fontSize: 18,
        lineHeight: 1.5,
        color: '#2d2d2d',
        textAlign: 'center',
        fontFamily: fontFamily,
        marginBottom: 20
    },
    pageNumber: {
        position: 'absolute',
        bottom: 20,
        right: 30,
        fontSize: 14,
        color: '#999999',
        fontFamily: fontFamily
    }
});

const BookDocument = ({ book, fontFamily }) => {
    const rawContent = book.story_content || {};
    const pages = Array.isArray(rawContent) ? rawContent : (rawContent.pages || []);
    const styles = getStyles(fontFamily);

    // FIX: Use actual story title first
    const formattedTitle = (rawContent.title || book.title || "Histoire Personnalisée")
        .replace(/\{childName\}|\[Son prénom\]/gi, book.child_name || 'Votre enfant');

    return (
        <Document>
            {/* COVER PAGE - Landscape */}
            <Page size="A4" orientation="landscape" style={styles.coverPage}>

                {/* Header: Title & Subtitle */}
                <View style={styles.coverHeader}>
                    <Text style={styles.title}>{formattedTitle}</Text>
                    <Text style={styles.subtitle}>Une histoire pour {book.child_name}</Text>
                </View>

                {/* Center: Image */}
                {book.cover_image_url ? (
                    <Image src={book.cover_image_url} style={styles.coverImage} />
                ) : <View style={{ height: 350 }} />}

                {/* Footer: Website */}
                <View style={styles.coverFooter}>
                    <Text style={{ fontSize: 12, color: '#999', fontFamily: fontFamily }}>
                        KusomaKids.com
                    </Text>
                </View>
            </Page>

            {/* STORY PAGES - Landscape with side-by-side layout */}
            {pages.map((page, index) => (
                <Page key={index} size="A4" orientation="landscape" style={styles.page}>
                    {/* LEFT: Image (Full Bleed) */}
                    <View style={styles.imageSection}>
                        {/* Ensure image URL is valid before rendering Image component */}
                        {(page.image || page.image_url) ? (
                            <Image
                                src={page.image || page.image_url}
                                style={styles.storyImage}
                            />
                        ) : null}
                    </View>

                    {/* RIGHT: Text */}
                    <View style={styles.textSection}>
                        {/* PREVENT WORD SPLITTING: hyphenationCallback returns the whole word */}
                        <Text
                            style={styles.storyText}
                            hyphenationCallback={(word) => [word]}
                        >
                            {page.text}
                        </Text>
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

        const { data: tokenData, error: tokenError } = await supabaseAdmin
            .from('download_tokens')
            .select('*')
            .eq('token', token)
            .eq('book_id', bookId)
            .single();

        if (tokenError || !tokenData) {
            console.error("❌ Invalid token:", tokenError);
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

        // 7. Ensure Font is Registered
        const fontSuccess = await registerFont();
        const fontFamilyToUse = fontSuccess ? 'Chewy' : 'Helvetica';
        console.log(`🎨 Using Font: ${fontFamilyToUse}`);

        // 8. Generate PDF
        console.log("📄 Generating PDF stream...");
        const stream = await renderToStream(<BookDocument book={book} fontFamily={fontFamilyToUse} />);
        console.log("📄 PDF stream generated successfully.");

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="kusomakids-${(book.child_name || 'story').replace(/[^a-z0-9]/gi, '_')}.pdf"`,
            },
        });

    } catch (err) {
        console.error("❌ Secure download error:", err);
        // Return explicit error to user for debugging
        return NextResponse.json({ error: `Failed to generate PDF: ${err.message}` }, { status: 500 });
    }
}
