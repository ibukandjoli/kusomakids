import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { renderToStream, Document, Page, Text, Image, StyleSheet } from '@react-pdf/renderer';

// Styles for the PDF
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

    // Format Title
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
    const { bookId } = params;
    const supabase = await createClient(); // Authenticated server client

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch Book & Check Ownership (Using RLS ideally, but explicit check good)
    const { data: book, error } = await supabase
        .from('generated_books')
        .select('*')
        .eq('id', bookId)
        .single();

    if (error || !book) {
        return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // 3. Access Control & Credit Logic
    if (book.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if book is already unlocked
    if (!book.is_unlocked) {
        // Book is locked - Check if user is club member with credits
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_status, monthly_credits')
            .eq('id', user.id)
            .single();

        const isClubMember = profile?.subscription_status === 'active';
        const hasCredits = (profile?.monthly_credits || 0) > 0;

        if (isClubMember && hasCredits) {
            // Use credit to unlock book
            const { error: unlockError } = await supabase
                .from('generated_books')
                .update({ is_unlocked: true })
                .eq('id', bookId);

            if (unlockError) {
                console.error("Failed to unlock book:", unlockError);
                return NextResponse.json({ error: "Failed to unlock book" }, { status: 500 });
            }

            // Deduct credit
            const { error: creditError } = await supabase
                .from('profiles')
                .update({ monthly_credits: profile.monthly_credits - 1 })
                .eq('id', user.id);

            if (creditError) {
                console.error("Failed to deduct credit:", creditError);
            }

            console.log(`✅ Book unlocked using club credit. Credits remaining: ${profile.monthly_credits - 1}`);
        } else {
            // Not a member or no credits - must purchase
            return NextResponse.json({
                error: "Book needs to be purchased first.",
                needsPurchase: true,
                isClubMember,
                hasCredits
            }, { status: 403 });
        }
    }

    // 4. Generate Stream
    try {
        const stream = await renderToStream(<BookDocument book={book} />);

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="kusomakids-${book.child_name || 'story'}.pdf"`,
            },
        });
    } catch (err) {
        console.error("PDF Generation Error:", err);
        return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
    }
}
