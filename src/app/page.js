// src/app/page.js
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { bookService } from './services/bookService';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';

export default function Home() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const fetchBooks = async () => {
      const fetchedBooks = await bookService.getBooks();
      setBooks(fetchedBooks);
    };
    fetchBooks();
  }, []);

  return (
    <main className="min-h-screen bg-white">

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-b from-orange-50 to-white">
        {/* Animated Background Elements - "Magical" */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-300 rounded-full blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-300 rounded-full blur-3xl opacity-60 animate-bounce-slow"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-orange-200 rounded-full blur-[100px] opacity-40"></div>

        {/* Floating Stars/Sparkles (CSS shapes) */}
        <div className="absolute top-1/4 left-1/4 text-yellow-400 text-4xl animate-spin-slow opacity-80">✨</div>
        <div className="absolute bottom-1/3 right-1/4 text-orange-400 text-2xl animate-ping opacity-60">✦</div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* Text Column */}
            <div className="lg:w-1/2 text-center lg:text-left">
              <span className="inline-block py-2 px-4 rounded-full bg-white border border-orange-100 text-orange-600 font-bold text-sm mb-6 animate-fadeIn shadow-sm">
                🎁 Le cadeau préféré des enfants
              </span>
              <h1 className="text-4xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
                Donnez à votre enfant le pouvoir d'être le <span className="text-orange-500 relative inline-block">
                  Héros
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-orange-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" /></svg>
                </span>.
              </h1>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                Créez un livre magique et unique en 3 clics. Il verra son prénom, son visage et son univers s'animer. Le cadeau qui donne le goût de la lecture.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/books"
                  className="bg-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-600 transition-all shadow-xl hover:shadow-orange-500/30 transform hover:-translate-y-1 block sm:inline-block"
                >
                  Créer son livre magique
                </Link>
                <Link
                  href="/login"
                  className="bg-white text-gray-900 border-2 border-gray-100 px-8 py-4 rounded-full font-bold text-lg hover:border-orange-200 hover:text-orange-500 transition-all"
                >
                  Rejoindre le Club Kusoma
                </Link>
              </div>

              {/* Trust Bar */}
              <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-600 font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">🌍</span>
                  Histoires africaines
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">🤖</span>
                  100% Personnalisables
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">🎧</span>
                  Version audio inclus
                </div>
              </div>
            </div>

            {/* Image Column */}
            <div className="lg:w-1/2 relative perspective-1000">
              <div className="relative z-10 transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700">
                <Image
                  src="/images/books/salif-metiers/main.png"
                  alt="Livre personnalisé Kusoma Kids"
                  width={600}
                  height={600}
                  className="rounded-3xl shadow-2xl border-4 border-white"
                  priority
                />

                {/* Floating Elements */}
                <div className="absolute -bottom-8 -left-8 bg-white p-5 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce-slow border border-gray-50">
                  <div className="text-4xl">✨</div>
                  <div>
                    <p className="text-gray-900 font-bold text-lg">Magique !</p>
                    <p className="text-gray-500 text-sm">Livre numérique personnalisé</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- BOOKS PREVIEW --- */}
      <section className="py-24 bg-white relative z-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Nos dernières histoires</h2>
              <p className="text-gray-600">Découvrez les aventures préférées des enfants.</p>
            </div>
            <Link href="/books" className="text-orange-600 font-bold hover:text-orange-700 hidden md:block">
              Voir tout →
            </Link>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {books.slice(0, 4).map((book) => (
              <Link href={`/book/${book.id}`} key={book.id} className="group perspective-1000">
                <div className="relative aspect-[3/4] mb-6 transition-all duration-500 transform-style-3d group-hover:rotate-y-[-25deg] group-hover:rotate-x-[10deg] group-hover:scale-105">
                  {/* Front Cover */}
                  <div className="absolute inset-0 z-20 rounded-r-md shadow-md backface-hidden">
                    <Image
                      src={`/images/books/${book.folder}/main.png`}
                      alt={book.title}
                      fill
                      className="object-cover rounded-r-md shadow-xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-white/10 to-transparent rounded-r-md pointer-events-none"></div>
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/40 to-transparent pointer-events-none"></div>
                  </div>
                  {/* Spine & Back */}
                  <div className="absolute top-[2px] bottom-[2px] left-0 w-[12px] bg-gray-800 transform -translate-x-full rotate-y-[-90deg] origin-right z-10 rounded-l-sm border-r border-white/20"></div>
                  <div className="absolute top-1 bottom-1 right-2 w-[10px] bg-white transform translate-z-[-2px] rotate-y-[-5deg] z-0 shadow-sm border border-gray-100"></div>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors mt-4 text-lg">{book.title}</h3>
                <p className="text-sm text-gray-500">{book.ageRange}</p>
              </Link>
            ))}
          </div>
          <div className="mt-12 text-center md:hidden">
            <Link href="/books" className="inline-block border-2 border-orange-500 text-orange-600 px-6 py-3 rounded-full font-bold hover:bg-orange-50 transition-colors">
              Voir toutes les histoires
            </Link>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section id="how-it-works" className="py-20 bg-orange-50 border-y border-orange-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Comment ça marche ?</h2>
            <div className="w-20 h-1.5 bg-orange-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative z-10">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-[60px] left-[10%] right-[10%] h-1 bg-orange-200 border-t-2 border-dashed border-orange-300 -z-10"></div>

            {[
              {
                icon: (<svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>),
                title: "1. Choisissez",
                text: "une de nos histoires magiques"
              },
              {
                icon: (<svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
                title: "2. Personnalisez",
                text: "avec sa photo et son prénom"
              },
              {
                icon: (<svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>),
                title: "3. Prévisualisez",
                text: "gratuitement les 3 premières pages"
              },
              {
                icon: (<svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>),
                title: "4. Lisez",
                text: "en ligne ou achetez le PDF "
              },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-lg border-2 border-orange-100 flex items-center justify-center mb-6 z-10 transform group-hover:-translate-y-2 transition-transform duration-300">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 leading-snug px-4">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Pourquoi les parents adorent ?</h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Nos histoires offrent aux enfants une expérience éducative et ludique qui renforce leur confiance en eux et leur amour pour la lecture.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: "✨",
                title: "100% Personnalisé",
                desc: "Votre enfant est le héros. Son prénom et son visage s'animent pour une immersion totale."
              },
              {
                icon: "🌍",
                title: "Ancré en Afrique",
                desc: "Des visuels et des thèmes qui célèbrent nos cultures, nos paysages et nos valeurs avec fierté."
              },
              {
                icon: "❤️",
                title: "Renforce la lecture",
                desc: "Un enfant qui se voit dans un livre a 3x plus d'intérêt pour la lecture. C'est prouvé !"
              }
            ].map((feature, i) => (
              <div key={i} className="bg-orange-50/50 p-10 rounded-3xl hover:bg-orange-100/50 transition-colors duration-300 border border-orange-100">
                <div className="text-5xl mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-700 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS SECTION --- */}
      <section className="py-24 bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full blur-[100px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600 rounded-full blur-[120px] opacity-20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl font-bold mb-16 text-center">Les parents témoignent</h2>
          <Testimonials darkMode={true} />
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="py-24 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choisissez votre formule</h2>
            <p className="text-gray-600">Achetez une histoire unique ou rejoignez le club pour des avantages exclusifs.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
            {/* Card 1: Achat Direct */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col h-full hover:shadow-xl transition-shadow relative">
              <div className="mb-6">
                <span className="text-gray-500 font-bold tracking-wider text-sm uppercase">Achat d'une histoire</span>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">3.000 F CFA <span className="text-lg text-gray-400 font-normal">/ livre</span></h3>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-gray-600">
                  <span className="text-green-500">✓</span> 1 Livre PDF Haute Qualité
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <span className="text-green-500">✓</span> Personnalisation complète (Nom + Photo)
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <span className="text-green-500">✓</span> Prévisualisation 3 pages
                </li>
                <li className="flex items-center gap-3 text-gray-400 line-through decoration-gray-400">
                  <span className="text-gray-300">✕</span> Version Audio
                </li>
              </ul>
              <Link href="/books" className="block w-full py-4 rounded-xl border-2 border-gray-900 text-center font-bold text-gray-900 hover:bg-gray-900 hover:text-white transition-all">
                Créer son livre magique
              </Link>
            </div>

            {/* Card 2: Club Kusoma */}
            <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-800 flex flex-col relative overflow-hidden transform scale-105 z-10">
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl shadow-md">
                  LE CHOIX DES PARENTS
                </div>
              </div>

              <div className="mb-6">
                <span className="text-orange-400 font-bold tracking-wider text-sm uppercase">Club Kusoma</span>
                <h3 className="text-4xl font-bold text-white mt-2">6.500 F CFA <span className="text-lg text-gray-400 font-normal">/ mois</span></h3>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">✓</div>
                  <span className="text-white font-bold">Lecture en ligne illimitée (+ Audio)</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">✓</div>
                  <span className="text-white">1 Téléchargement PDF gratuit / mois</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">✓</div>
                  <span className="text-white">-50% sur les livres PDF supplémentaires</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">✓</div>
                  Accès aux histoires exclusives
                </li>
              </ul>
              <Link href="/club" className="block w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-center font-bold text-white hover:from-orange-600 hover:to-red-700 transition-all shadow-lg shadow-orange-500/25">
                Rejoindre le Club Kusoma
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION (NEW) --- */}
      <FAQ />

    </main>
  );
}