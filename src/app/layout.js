// src/app/layout.js
import './globals.css';
import { Nunito } from 'next/font/google';
import Header from './components/Header';
import Footer from './components/Footer';
import { BookProvider } from './context/BookContext';

const nunito = Nunito({ subsets: ['latin'] });

export const metadata = {
  title: 'KusomaKids - Livres personnalisés pour enfants africains',
  description: 'Des livres personnalisés qui célèbrent l\'identité et la culture des enfants africains',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={nunito.className}>
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