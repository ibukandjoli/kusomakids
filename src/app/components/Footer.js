// src/app/components/Footer.js
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  // Hide on Auth Pages and Preview Page
  const isHidden = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(pathname) || pathname.includes('/preview') || pathname.startsWith('/dashboard') || pathname.includes('/read/');

  if (isHidden) return null;

  const currentYear = new Date().getFullYear();
  const [phoneNumber, setPhoneNumber] = useState('');

  return (
    <footer className="bg-gray-900 text-white pt-20 pb-10 border-t border-gray-800">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-12 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-4 lg:col-span-4">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center font-bold text-xl text-white">
                K
              </div>
              <span className="text-2xl font-bold tracking-tight">
                Kusoma<span className="text-orange-500">Kids</span>
              </span>
            </Link>
            <p className="text-gray-400 leading-relaxed mb-6">
              Une plateforme magique qui transforme votre enfant en héros d'histoires uniques. Nous proposons l'histoire, vous la perfectionnez, et votre enfant la dévore.
            </p>
            <div className="flex gap-4">
              <a href="https://instagram.com/kusomakids" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 transition-colors text-white">
                <span className="sr-only">Instagram</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465C9.673 2.013 10.03 2 12.48 2h-1.65m1.65 1.832h.01c.22 0 .445.006.67.017.06.003.118.006.176.01.298.02.59.043.882.072.228.022.454.045.677.07.262.03.522.062.778.098.397.054.78.114 1.155.18.27.046.536.096.797.148.56.113 1.096.262 1.614.444.64.225 1.205.538 1.705.938.5.4.887.892 1.153 1.455.197.417.336.873.414 1.345.05.297.086.6.11.905.02.261.036.525.048.79.02.438.032.884.037 1.334V12c0 2.22-.016 2.584-.062 3.522-.047.93-.213 1.61-.453 2.21a4.234 4.234 0 01-2.455 2.454c-.6.24-1.28.406-2.21.453-.938.046-1.302.062-3.522.062s-2.584-.016-3.522-.062c-.93-.047-1.61-.213-2.21-.453a4.234 4.234 0 01-2.455-2.454c-.24-.6-.406-1.28-.453-2.21-.046-938-.062-1.302-.062-3.522s.016-2.584.062-3.522c.047-.93.213-1.61.453-2.21a4.234 4.234 0 012.455-2.454c.6-.24 1.28-.406 2.21-.453.938-.046 1.302-.062 3.522-.062m0 2.378c-3.138 0-5.684 2.546-5.684 5.684 0 3.138 2.546 5.684 5.684 5.684 3.138 0 5.684-2.546 5.684-5.684 0-3.138-2.546-5.684-5.684-5.684m0 1.95a3.734 3.734 0 100 7.468 3.734 3.734 0 000-7.468m4.993-2.31a1.299 1.299 0 110 2.598 1.299 1.299 0 010-2.598" clipRule="evenodd" /></svg>
              </a>
              <a href="https://facebook.com/kusomakids" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 transition-colors text-white">
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
              </a>
              <a href="https://tiktok.com/kusomakids" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 transition-colors text-white">
                <span className="sr-only">TikTok</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-2 lg:col-span-2">
            <h4 className="font-bold text-lg mb-6">Plateforme</h4>
            <ul className="space-y-4 text-gray-400">
              <li><Link href="/books" className="hover:text-orange-500 transition-colors">Bibliothèque</Link></li>
              <li><Link href="/club" className="hover:text-orange-500 transition-colors">Club Kusoma</Link></li>
              <li><Link href="/dashboard" className="hover:text-orange-500 transition-colors">Mon espace</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2 lg:col-span-2">
            <h4 className="font-bold text-lg mb-6">Aide</h4>
            <ul className="space-y-4 text-gray-400">
              <li><Link href="/faq" className="hover:text-orange-500 transition-colors">FAQ</Link></li>
              <li><Link href="/support" className="hover:text-orange-500 transition-colors">Contact</Link></li>
              <li><Link href="/legal" className="hover:text-orange-500 transition-colors">Mentions Légales</Link></li>
            </ul>
          </div>

          {/* Newsletter / CTA */}
          <div className="md:col-span-4 lg:col-span-4">
            <h4 className="font-bold text-lg mb-6">Rejoignez le Club</h4>
            <p className="text-gray-400 mb-4">
              Personnalisez vos histoires en illimité, lisez-les en ligne (audio inclus), et téléchargez chaque mois une histoire en PDF.
            </p>
            <div className="flex flex-col gap-4">
              <Link href="/club" className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-xl font-bold transition-colors text-center shadow-lg hover:shadow-orange-500/25">
                Rejoindre le Club
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {currentYear} TEKKI Studio. Fait avec ❤️ à Dakar.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
            <Link href="/terms" className="hover:text-white transition-colors">CGV</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}