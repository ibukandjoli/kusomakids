import './globals.css';
import { Suspense } from 'react';
import { Nunito, Fredoka, Chewy } from 'next/font/google';
import Header from './components/Header';
import Footer from './components/Footer';
import { BookProvider } from './context/BookContext';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import MetaPixel from './components/MetaPixel';
import Script from 'next/script';
import AnalyticsTracker from './components/AnalyticsTracker';

const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' });
const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka' });
const chewy = Chewy({ weight: '400', subsets: ['latin'], variable: '--font-chewy' });

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FF6B00',
}

export const metadata = {
  metadataBase: new URL('https://kusomakids.com'),
  title: {
    default: 'KusomaKids - Livres personnalisés pour enfants africains',
    template: '%s | KusomaKids'
  },
  description: 'Offrez à votre enfant une aventure magique dont il est le héros. Des livres personnalisés célébrant l\'identité africaine, avec son prénom et son avatar.',
  keywords: ['livre personnalisé', 'enfant africain', 'conte africain', 'cadeau enfant', 'lecture', 'identité', 'culture'],
  authors: [{ name: 'KusomaKids Team' }],
  creator: 'KusomaKids',
  publisher: 'KusomaKids',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'KusomaKids - Le héros de l\'histoire, c\'est votre enfant',
    description: 'Créez en 3 minutes un livre unique où votre enfant vit des aventures magiques en Afrique.',
    url: 'https://kusomakids.com',
    siteName: 'KusomaKids',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'KusomaKids Preview',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KusomaKids - Livres personnalisés',
    description: 'Votre enfant héros de son propre conte africain.',
    images: ['/images/og-default.jpg'],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION_ID,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'KusomaKids',
  url: 'https://kusomakids.com',
  logo: 'https://kusomakids.com/icon.png',
  sameAs: [
    'https://www.facebook.com/kusomakids',
    'https://www.instagram.com/kusomakids'
  ],
  description: 'Livres personnalisés célébrant l\'identité africaine.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={`${nunito.className} ${fredoka.variable} ${chewy.variable}`}>
        {/* SEO Schema */}
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Marketing & Analytics */}
        <MetaPixel />
        <Analytics />
        <SpeedInsights />
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>

        <BookProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </BookProvider>
      </body>
    </html>
  );
}