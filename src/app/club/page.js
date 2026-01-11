'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function ClubPage() {
    return (
        <div className="min-h-screen bg-white pt-32 pb-20">

            {/* Hero Section */}
            <div className="container mx-auto px-4 text-center mb-20">
                <span className="inline-block py-1 px-4 rounded-full bg-orange-100 text-orange-600 font-bold text-sm mb-6">
                    👑 Le Cercle Privé des Petits Lecteurs
                </span>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                    Rejoignez le <span className="text-orange-500">Club Kusoma</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                    Offrez à votre enfant une bibliothèque infinie d'aventures africaines et développez son amour de la lecture pour moins que le prix d'un seul repas.
                </p>
                <Link
                    href="/login?plan=club"
                    className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl px-10 py-4 rounded-full shadow-xl shadow-orange-500/30 transform hover:-translate-y-1 transition-all"
                >
                    Essayer Gratuitement
                </Link>
                <p className="text-sm text-gray-400 mt-4">Annulable à tout moment • Pas de frais cachés</p>
            </div>

            {/* Benefits Grid */}
            <div className="container mx-auto px-4 mb-20">
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { title: "Accès Illimité", desc: "Lisez toutes nos histoires en ligne quand vous voulez.", icon: "📚" },
                        { title: "1 Livre PDF offert / mois", desc: "Téléchargez un livre à garder pour toujours chaque mois.", icon: "🎁" },
                        { title: "Contenu Exclusif", desc: "Accès en avant-première aux nouvelles sorties.", icon: "✨" },
                        { title: "Audio Inclus", desc: "Toutes les histoires sont narrées pour faciliter l'apprentissage.", icon: "🎧" },
                        { title: "Mode Hors-Ligne", desc: "Accédez à votre bibliothèque même sans internet (via PDF).", icon: "✈️" },
                        { title: "Support Prioritaire", desc: "Une équipe dédiée pour vous accompagner.", icon: "❤️" }
                    ].map((item, i) => (
                        <div key={i} className="bg-gray-50 hover:bg-orange-50 p-8 rounded-2xl transition-colors border border-gray-100">
                            <div className="text-4xl mb-4">{item.icon}</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                            <p className="text-gray-600">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pricing Card (Highlight) */}
            <div className="container mx-auto px-4 max-w-lg">
                <div className="bg-gray-900 text-white p-10 rounded-3xl shadow-2xl relative overflow-hidden border border-gray-800">
                    <div className="absolute top-0 right-0 bg-yellow-500 text-gray-900 text-xs font-bold px-4 py-1 rounded-bl-xl">OFFRE DE LANCEMENT</div>

                    <div className="text-center mb-8">
                        <p className="text-gray-400 font-medium uppercase tracking-widest mb-2">Abonnement Mensuel</p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-5xl font-bold">6.500 F</span>
                            <span className="text-xl text-gray-500">CFA / mois</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-4">Soit environ 215 F CFA / jour pour l'éducation de votre enfant.</p>
                    </div>

                    <ul className="space-y-4 mb-10">
                        <li className="flex items-center gap-3"><span className="text-green-400">✓</span> Accès illimité à toute la bibliothèque</li>
                        <li className="flex items-center gap-3"><span className="text-green-400">✓</span> 1 Téléchargement PDF Personnalisé inclus</li>
                        <li className="flex items-center gap-3"><span className="text-green-400">✓</span> Versions Audio</li>
                        <li className="flex items-center gap-3"><span className="text-green-400">✓</span> Sans engagement</li>
                    </ul>

                    <Link href="/login?plan=club" className="block w-full bg-orange-500 hover:bg-orange-600 py-4 rounded-xl font-bold text-center transition-colors">
                        Je m'abonne maintenant
                    </Link>
                </div>
            </div>

        </div>
    );
}
