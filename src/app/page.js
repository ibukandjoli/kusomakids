
import HomeClient from '@/app/components/HomeClient';

export const metadata = {
  title: 'KusomaKids - Livres personnalisés pour enfants africains',
  description: 'Créez un livre unique où votre enfant devient le héros. Des histoires magiques célébrant l\'identité africaine, avec son prénom et son avatar.',
  openGraph: {
    title: 'KusomaKids - Le héros de l\'histoire, c\'est votre enfant',
    description: 'Créez en 2 minutes un livre unique où votre enfant vit des aventures magiques en Afrique.',
    url: 'https://kusomakids.com',
    siteName: 'KusomaKids',
    images: [
      {
        url: '/images/og-home.jpg', // Specific image for home
        width: 1200,
        height: 630,
        alt: 'KusomaKids - Livres personnalisés',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function Home() {
  return <HomeClient />;
}