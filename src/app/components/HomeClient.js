'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { formatTitle } from '@/utils/format';
import { bookService } from '@/app/services/bookService';
import Testimonials from '@/app/components/Testimonials';
import FAQ from '@/app/components/FAQ';
import WaveDivider from '@/app/components/WaveDivider';

// --- Components ---

// Scroll Reveal Section
function MotionSection({ children, className, delay = 0, id = '' }) {
    return (
        <motion.section
            id={id}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay }}
            className={className}
        >
            {children}
        </motion.section>
    );
}

// Hero Visual Component (Shapes, Image, Badge)
function HeroVisual({ className }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`relative z-10 ${className}`}
        >
            {/* Animated Blob Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-orange-200/50 mix-blend-multiply filter blur-xl opacity-70 animate-blob -z-10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-purple-200/50 mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 -z-10"></div>

            <div className="relative transform hover:scale-[1.02] transition-transform duration-500 max-w-xl mx-auto">
                <div className="rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white transform rotate-2 hover:rotate-0 transition-all duration-500 relative aspect-square w-full">
                    <Image
                        src="/images/ayana_book.png"
                        alt="Livre personnalisé Kusoma Kids"
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 768px) 100vw, 800px"
                    />
                </div>

                {/* Floating Badge */}
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-orange-100"
                >
                    <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center text-2xl">✨</div>
                    <div>
                        <p className="text-gray-900 font-bold">Magique !</p>
                        <p className="text-gray-500 text-xs">Plus de 50 parents ravis</p>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}

export default function HomeClient() {
    const [books, setBooks] = useState([]);
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    useEffect(() => {
        const fetchBooks = async () => {
            const fetchedBooks = await bookService.getBooks();
            setBooks(fetchedBooks);
        };
        fetchBooks();
    }, []);

    return (
        <div className="w-full bg-noise">

            {/* --- HERO SECTION --- (Orange-50/30) */}
            <section className="relative pt-32 pb-48 lg:pt-48 lg:pb-64 overflow-hidden">
                {/* Background Particles (Framer Motion Parallax) */}
                <motion.div style={{ y: y1 }} className="absolute top-20 left-10 text-yellow-400 opacity-20 text-9xl font-black pointer-events-none select-none z-0">
                    ▲
                </motion.div>
                <motion.div style={{ y: y2 }} className="absolute bottom-40 right-10 text-orange-400 opacity-10 text-9xl font-black pointer-events-none select-none z-0 rounded-full">
                    ●
                </motion.div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-orange-200 to-pink-200 rounded-full blur-[120px] opacity-30 pointer-events-none"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                        {/* Text Column */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="lg:w-1/2 text-center lg:text-left"
                        >
                            <span className="inline-block py-2 px-4 rounded-full bg-white/80 border border-orange-100 text-orange-600 font-bold text-sm mb-6 shadow-sm backdrop-blur-sm">
                                🎁 Le cadeau qui donne le goût de lire
                            </span>
                            <h1 className="text-4xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
                                Donnez à votre enfant le pouvoir d'être le <span className="text-orange-600 relative inline-block">
                                    Héros
                                    <svg className="absolute w-full h-4 -bottom-2 left-0 text-orange-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="12" fill="none" /></svg>
                                </span>.
                            </h1>
                            <p className="text-xl text-gray-700 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                                Créez et personnalisez des histoires sur-mesure où son <span className="font-bold">prénom</span> et son <span className="font-bold">visage</span> prennent vie. Fini les héros qui ne lui ressemblent pas. Offrez-lui le plus beau cadeau pour sa <span className="font-bold text-orange-600 bg-orange-100 px-1 rounded">confiance en lui.</span>
                            </p>

                            {/* MOBILE VISUAL (between promise and action) */}
                            <div className="lg:hidden mb-12">
                                <HeroVisual />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link
                                        href="/books"
                                        className="bg-orange-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2"
                                    >
                                        Créer son livre magique <span className="text-2xl animate-spin-slow">🪄</span>
                                    </Link>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link
                                        href="/club"
                                        className="bg-white text-gray-900 border-2 border-gray-100 px-8 py-4 rounded-full font-bold text-lg hover:border-orange-200 hover:text-orange-500 transition-all flex items-center justify-center gap-2"
                                    >
                                        Rejoindre le Club
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 ml-2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </Link>
                                </motion.div>
                            </div>

                            {/* Social Proof - Restored */}
                            <div className="flex items-center justify-center lg:justify-start gap-4 animate-fadeIn delay-150 mb-10">
                                <div className="flex -space-x-4">
                                    <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                        <Image src="/images/users/aminata.jpg" alt="Parent" width={40} height={40} />
                                    </div>
                                    <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                        <Image src="/images/users/fatou.jpg" alt="Parent" width={40} height={40} />
                                    </div>
                                    <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                        <Image src="/images/users/yass.jpg" alt="Parent" width={40} height={40} />
                                    </div>
                                    <div className="w-10 h-10 rounded-full border-2 border-white bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-600">
                                        +50
                                    </div>
                                </div>
                                <div>
                                    <div className="flex text-yellow-400 text-sm">★★★★★</div>
                                    <p className="text-sm text-gray-600 font-medium">&quot;Magique, ma fille adore son livre !&quot; - <span className="text-gray-900 font-bold">Fatou D.</span></p>
                                </div>
                            </div>

                            {/* Trust Bar - Restored & Fixed */}
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-600 font-bold bg-white/50 p-4 rounded-2xl backdrop-blur-sm inline-block">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">🌍</span>
                                    Histoires africaines
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">✍️</span>
                                    100% Personnalisables
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">🎧</span>
                                    Version audio inclus
                                </div>
                            </div>
                        </motion.div>

                        {/* DESKTOP VISUAL (Right Column) */}
                        <HeroVisual className="lg:w-1/2 hidden lg:block" />

                    </div>
                </div>

                {/* WAVE DIVIDER: Hero (Orange-50/30) -> Books (White) */}
                <WaveDivider position="bottom" color="text-white" />
            </section>

            {/* --- BOOKS PREVIEW --- (White) */}
            <MotionSection className="pt-32 pb-48 bg-white relative z-20">

                <div className="container mx-auto px-4 mt-12">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Nos dernières créations 🦁</h2>
                            <p className="text-gray-600 text-lg">Découvrez les aventures qui font rêver.</p>
                        </div>
                        <Link href="/books" className="text-orange-600 font-bold hover:text-orange-700 hidden md:block">
                            Voir tout →
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {books.slice(0, 3).map((book, i) => (
                            <motion.div
                                key={book.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -10 }}
                                whileTap={{ scale: 0.98 }}
                                className="group cursor-pointer"
                            >
                                <Link href={`/book/${book.id}`}>
                                    <div className="relative aspect-square mb-4 rounded-[2rem] overflow-hidden shadow-md group-hover:shadow-2xl transition-all duration-300 border border-gray-100">
                                        {/* Realistic Texture Overlay */}
                                        <div className="absolute inset-0 bg-noise opacity-50 pointer-events-none z-10 mix-blend-multiply"></div>
                                        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-white/20 z-20"></div> {/* Spine Highlight */}

                                        <Image
                                            src={book.coverUrl || `/images/books/${book.folder}/main.png`}
                                            alt={book.title}
                                            fill
                                            className="object-cover transform group-hover:scale-105 transition-transform duration-700"
                                        />
                                    </div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors text-xl leading-tight mb-2">{formatTitle(book.title)}</h3>
                                    <p className="text-sm text-gray-500 italic">{book.tagline || book.ageRange}</p>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                    <div className="mt-12 text-center md:hidden">
                        <Link href="/books" className="inline-block border-2 border-orange-500 text-orange-600 px-6 py-3 rounded-full font-bold hover:bg-orange-50 transition-colors">
                            Voir toutes les histoires
                        </Link>
                    </div>
                </div>

                {/* WAVE DIVIDER: Books (White) -> HowItWorks (Orange-50) */}
                <WaveDivider position="bottom" color="text-orange-50" />
            </MotionSection>

            {/* --- HOW IT WORKS SECTION --- (Orange-50) */}
            <MotionSection id="how-it-works" className="pt-32 pb-48 bg-orange-50 relative overflow-hidden">

                {/* Floating Background Shapes */}
                <div className="absolute top-20 right-0 w-64 h-64 bg-yellow-300/20 rounded-full blur-3xl animate-float-delayed"></div>
                <div className="absolute bottom-10 left-10 w-48 h-48 bg-orange-300/20 rounded-full blur-3xl animate-float"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">La magie opère en 2 minutes ⏱️</h2>
                        <div className="w-24 h-2 bg-orange-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8 relative z-10">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-[60px] left-[10%] right-[10%] h-1 bg-orange-200 border-t-2 border-dashed border-orange-300 -z-10"></div>

                        {[
                            { emoji: "🎭", title: "1. Choisissez", text: "le thème de l'histoire" },
                            { emoji: "✏️", title: "2. Personnalisez", text: "prénom, âge et photo" },
                            { emoji: "👀", title: "3. Prévisualisez", text: "et modifiez le texte si besoin" },
                            { emoji: "📖", title: "4. Savourez", text: "en lecture ou en audio" },
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                className="flex flex-col items-center text-center group cursor-default"
                                whileHover={{ y: -5 }}
                            >
                                <div className="w-24 h-24 bg-white rounded-3xl shadow-lg border-2 border-white flex items-center justify-center mb-6 z-10 transform transition-transform duration-300 text-4xl relative overflow-hidden">
                                    <div className="absolute inset-0 bg-orange-100 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
                                    <span className="relative z-10">{step.emoji}</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                                <p className="text-gray-600 leading-snug px-4">{step.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* WAVE DIVIDER: HowItWorks (Orange-50) -> Features (White) */}
                <WaveDivider position="bottom" color="text-white" />
            </MotionSection>

            {/* --- FEATURES SECTION --- (White) */}
            <MotionSection className="pt-32 pb-48 bg-white relative">

                <div className="container mx-auto px-4 mt-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Pourquoi les parents adorent ?</h2>
                        <p className="text-xl text-gray-600 leading-relaxed">
                            Plus qu'un livre, c'est un outil pédagogique qui célèbre l'identité de votre enfant.
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
                                title: "Fierté Culturelle",
                                desc: "Des thèmes et des visuels qui valorisent l'Afrique, ses paysages et ses valeurs."
                            },
                            {
                                icon: "❤️",
                                title: "Confiance en soi",
                                desc: "Un enfant qui se voit dans un livre développe 3x plus d'estime de soi."
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.03 }}
                                className="bg-white p-10 rounded-[2rem] shadow-xl border border-gray-100 hover:border-orange-200 transition-all duration-300 relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                                <div className="text-6xl mb-6 relative z-10">{feature.icon}</div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3 relative z-10">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed relative z-10">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* WAVE DIVIDER: Features (White) -> Testimonials (Gray-900) */}
                <WaveDivider position="bottom" color="text-gray-900" />
            </MotionSection>

            {/* --- TESTIMONIALS SECTION --- (Gray-900) */}
            <section className="pt-32 pb-48 bg-gray-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600 rounded-full blur-[120px] opacity-20 animate-float"></div>

                {/* Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.05]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`
                }}></div>

                <div className="container mx-auto px-4 relative z-10">
                    <MotionSection>
                        <h2 className="text-3xl font-bold mb-16 text-center">La parole aux familles 💬</h2>
                        <Testimonials darkMode={true} />
                    </MotionSection>
                </div>

                {/* WAVE DIVIDER: Testimonials (Gray-900) -> Pricing (White) */}
                <WaveDivider position="bottom" color="text-white" />
            </section>

            {/* --- PRICING SECTION --- (White) */}
            <MotionSection id="pricing" className="pt-32 pb-48 bg-white relative">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Une formule pour chaque besoin</h2>
                        <p className="text-gray-600">Offrez une histoire unique ou rejoignez le club pour lire toute l'année.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
                        {/* Card 1: Achat Direct */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col h-full relative"
                        >
                            <div className="mb-6">
                                <span className="text-gray-500 font-bold tracking-wider text-sm uppercase">À la carte</span>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">3.000 F CFA <span className="text-lg text-gray-400 font-normal">/ livre</span></h3>
                            </div>
                            <ul className="space-y-4 mb-8 flex-grow">
                                <li className="flex items-center gap-3 text-gray-600"><span className="text-green-500 font-bold">✓</span> 1 Livre PDF Haute Qualité</li>
                                <li className="flex items-center gap-3 text-gray-600"><span className="text-green-500 font-bold">✓</span> Personnalisation complète</li>
                                <li className="flex items-center gap-3 text-gray-600"><span className="text-green-500 font-bold">✓</span> Modification du texte</li>
                                <li className="flex items-center gap-3 text-gray-400 opacity-50"><span className="text-gray-300">✕</span> Accès bibliothèque limité</li>
                            </ul>
                            <Link href="/books" className="block w-full py-4 rounded-xl border-2 border-gray-900 text-center font-bold text-gray-900 hover:bg-gray-900 hover:text-white transition-all">
                                Créer mon livre
                            </Link>
                        </motion.div>

                        {/* Card 2: Club Kusoma */}
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="bg-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-800 flex flex-col relative overflow-hidden z-10 scale-105"
                        >
                            <div className="absolute top-0 right-0">
                                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl shadow-md">
                                    LA PLUS POPULAIRE
                                </div>
                            </div>

                            {/* Glow Effect */}
                            <div className="absolute -top-20 -left-20 w-40 h-40 bg-orange-500 rounded-full blur-[80px] opacity-20"></div>

                            <div className="mb-6 relative z-10">
                                <span className="text-orange-400 font-bold tracking-wider text-sm uppercase">Club Kusoma VIP</span>
                                <h3 className="text-4xl font-bold text-white mt-2">6.500 F CFA <span className="text-lg text-gray-400 font-normal">/ mois</span></h3>
                            </div>
                            <ul className="space-y-4 mb-8 flex-grow relative z-10">
                                <li className="flex items-center gap-3 text-white"><span className="text-orange-500 bg-orange-500/20 rounded-full w-6 h-6 flex items-center justify-center text-xs">✓</span> Lecture illimitée (+ Audio)</li>
                                <li className="flex items-center gap-3 text-white"><span className="text-orange-500 bg-orange-500/20 rounded-full w-6 h-6 flex items-center justify-center text-xs">✓</span> 1 PDF offert / mois</li>
                                <li className="flex items-center gap-3 text-white"><span className="text-orange-500 bg-orange-500/20 rounded-full w-6 h-6 flex items-center justify-center text-xs">✓</span> -50% sur les suivants</li>
                                <li className="flex items-center gap-3 text-white"><span className="text-orange-500 bg-orange-500/20 rounded-full w-6 h-6 flex items-center justify-center text-xs">✓</span> Histoires exclusives</li>
                            </ul>
                            <motion.div whileTap={{ scale: 0.95 }} className="relative z-10">
                                <Link href="/club" className="block w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-center font-bold text-white hover:from-orange-600 hover:to-red-700 transition-all shadow-lg shadow-orange-500/25">
                                    Rejoindre le Club
                                </Link>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>

                {/* WAVE DIVIDER: Pricing (White) -> FAQ (Orange-50) */}
                <WaveDivider position="bottom" color="text-orange-50" />
            </MotionSection>

            {/* --- FAQ SECTION --- (Orange-50) */}
            <MotionSection className="bg-orange-50 relative pt-32 pb-24">
                {/* Footer next is usually white, if we want a transition to footer we could add one here, but keeping standard for now */}
                <FAQ />
            </MotionSection>

        </div>
    );
}
