
import BooksClient from '@/app/components/BooksClient';

export const metadata = {
    title: 'La Bibliothèque Magique - KusomaKids',
    description: 'Explorez notre collection de livres personnalisables pour enfants africains. Aventure, confiance en soi, découverte... trouvez l\'histoire parfaite.',
    openGraph: {
        title: 'La Bibliothèque Magique - Histoires pour enfants africains',
        description: 'Une collection unique d\'aventures personnalisées célébrant l\'identité africaine.',
        url: 'https://kusomakids.com/books',
        siteName: 'KusomaKids',
        images: [
            {
                url: '/images/og-library.jpg',
                width: 1200,
                height: 630,
                alt: 'Bibliothèque KusomaKids',
            },
        ],
        locale: 'fr_FR',
        type: 'website',
    },
};

export default function BooksPage() {
    return <BooksClient />;
}