import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import React from 'react';
import { renderToStream, Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';

// Register Fonts (Optional - using standard Helvetica/Times for now to ensure reliability)
// If you have custom fonts, register them here.

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FDFBF7',
        padding: 40,
    },
    coverPage: {
        flexDirection: 'column',
        backgroundColor: '#FDFBF7',
        padding: 0,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    coverImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    pageImage: {
        width: '100%',
        height: 350,
        objectFit: 'contain',
        marginBottom: 20,
        borderRadius: 10,
    },
    textContainer: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
    },
    text: {
        fontSize: 16,
        lineHeight: 1.5,
        textAlign: 'center',
        color: '#374151',
        fontFamily: 'Helvetica',
    },
    pageNumber: {
        position: 'absolute',
        fontSize: 12,
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'gray',
    },
    title: {
        fontSize: 30,
        marginBottom: 20,
        textAlign: 'center',
        fontFamily: 'Helvetica-Bold',
    },
    author: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 40,
        color: '#666',
    }
});

// PDF Document Component
const BookDocument = ({ book }) => {
    const pages = book.content?.pages || book.story_content?.pages || [];
    const title = (book.title_template || book.title || 'Mon Aventure').replace(/\{childName\}/gi, book.child_name || 'l\'enfant');

    // Get cover image: priority to col, then first page
    const coverUrl = book.cover_image_url || book.cover_url || (pages[0]?.image);

    return (
        <Document>
            {/* Cover Page */}
            {coverUrl && (
                <Page size="A4" style={styles.coverPage}>
                    <Image src={coverUrl} style={styles.coverImage} />
                    {/* Overlay Title if needed, but cover usually has text. If generic, we adds it? 
                         Let's assume our generated covers might have text or not. 
                         For now, full bleed image is best for "Cover". 
                     */}
                </Page>
            )}

            {/* Title Page (Backup if cover is image only) */}
            <Page size="A4" style={styles.page}>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.author}>Une aventure pour {book.child_name}</Text>
                    <Text style={styles.author}>KusomaKids</Text>
                </View>
            </Page>

            {/* Story Pages */}
            {pages.map((page, index) => (
                <Page key={index} size="A4" style={styles.page}>
                    {page.image && (
                        <Image src={page.image} style={styles.pageImage} />
                    )}
                    <View style={styles.textContainer}>
                        <Text style={styles.text}>{page.text}</Text>
                    </View>
                    <Text style={styles.pageNumber}>- {index + 1} -</Text>
                </Page>
            ))}
        </Document>
    );
};

export async function GET(req, { params }) {
    try {
        const { id } = params;
        const supabase = await createClient();

        // 1. Auth Check (Optional: Allow public download with signed token? Users usually need auth)
        // For simpler printing service, maybe admin key? 
        // Let's enforce Session for now to prevent leaking.
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch Book
        const { data: book, error } = await supabase
            .from('generated_books')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        // 3. Access Check
        // Allow if owner OR if admin (not implemented yet)
        if (book.user_id !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Ensure unlocked? 
        if (!book.is_unlocked) {
            // Check if club member?
            const { data: profile } = await supabase.from('profiles').eq('id', session.user.id).single();
            if (profile?.subscription_status !== 'active') {
                return NextResponse.json({ error: 'Book locked' }, { status: 403 });
            }
        }

        // 4. Generate PDF Stream
        const stream = await renderToStream(<BookDocument book={book} />);

        // 5. Return Response
        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${(book.title || 'story').replace(/[^a-z0-9]/gi, '_')}.pdf"`,
            },
        });

    } catch (err) {
        console.error("PDF Generation Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
