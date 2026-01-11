import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// Styles du PDF
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#fff',
    },
    // --- Styles Couverture ---
    coverPage: {
        flex: 1,
        position: 'relative', // Pour l'overlay
        backgroundColor: '#000', // Fond noir si image ne charge pas
    },
    coverImagePlaceholder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#78350F', // Ambre foncé (Fond image)
        alignItems: 'center',
        justifyContent: 'center',
    },
    coverImageText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 24,
        fontWeight: 'bold',
    },
    coverOverlay: {
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.4)', // Fond semi-transparent pour lisibilité
        alignItems: 'center',
    },
    title: {
        fontSize: 42,
        color: '#FFF',
        fontFamily: 'Helvetica-Bold', // Police standard grasse
        textAlign: 'center',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 24,
        color: '#FCD34D', // Ambre clair
        fontFamily: 'Helvetica',
        marginBottom: 5,
    },
    author: {
        fontSize: 14,
        color: '#FFF',
        marginTop: 20,
        opacity: 0.8,
    },
    // --- Styles Pages Histoire ---
    imageSection: {
        height: '65%', // Plus grand (65%)
        backgroundColor: '#F3F4F6',
        justifyContent: 'flex-end', // Aligne l'image en bas du bloc si besoin
        alignItems: 'center',
    },
    imageContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        color: '#9CA3AF',
        fontSize: 16,
        marginBottom: 8,
    },
    promptDebug: {
        fontSize: 8,
        color: '#9CA3AF',
        paddingHorizontal: 20,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    textSection: {
        height: '35%', // Reste (35%)
        paddingHorizontal: 50,
        paddingVertical: 20,
        justifyContent: 'center', // Centrage Vertical
        alignItems: 'center', // Centrage Horizontal
        backgroundColor: '#fff',
    },
    storyText: {
        fontSize: 20, // Plus grand
        lineHeight: 1.6,
        textAlign: 'center',
        color: '#111827',
        fontFamily: 'Times-Roman', // Police Serif "Livre"
    },
    pageNumber: {
        position: 'absolute',
        bottom: 15,
        fontSize: 10,
        color: '#9CA3AF',
    },
});

// Composant Document PDF
const BookPdf = ({ story, childName }) => (
    <Document>
        {/* Page de Couverture - PLEINE PAGE */}
        <Page size="A4" style={styles.coverPage}>
            {/* Simulation Image de fond (Placeholder) */}
            <View style={styles.coverImagePlaceholder}>
                <Text style={styles.coverImageText}>[Illustration Couverture Pleine Page]</Text>
            </View>

            {/* Overlay Titre */}
            <View style={styles.coverOverlay}>
                <Text style={styles.title}>{story.title}</Text>
                <Text style={styles.subtitle}>Une aventure de {childName}</Text>
                <Text style={styles.author}>Kusoma Kids</Text>
            </View>
        </Page>

        {/* Pages de l'histoire */}
        {story.pages.map((page, index) => (
            <Page key={index} size="A4" style={styles.page}>
                {/* Bloc Image - 65% de la page */}
                <View style={styles.imageSection}>
                    <View style={styles.imageContainer}>
                        <Text style={styles.imagePlaceholderText}>[Illustration IA Full Width]</Text>
                        <Text style={styles.promptDebug}>{page.imagePrompt.substring(0, 80)}...</Text>
                    </View>
                </View>

                {/* Bloc Texte - Centré verticalement et horizontalement */}
                <View style={styles.textSection}>
                    <Text style={styles.storyText}>
                        {page.text}
                    </Text>
                    <Text style={styles.pageNumber}>{index + 1}</Text>
                </View>
            </Page>
        ))}
    </Document>
);

export default BookPdf;
