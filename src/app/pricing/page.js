export default function PricingPage() {
    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-6">Des tarifs simples et transparents</h1>
                    <p className="text-lg text-gray-600">
                        Choisissez la formule qui correspond le mieux à vos besoins de lecture.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Card 1: Standard */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="mb-6">
                            <span className="text-gray-500 font-bold tracking-wider text-sm uppercase">À la carte</span>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">3.000 FCFA <span className="text-lg text-gray-400 font-normal">/ livre</span></h3>
                        </div>
                        <ul className="space-y-4 mb-8 flex-grow">
                            <li className="flex items-center gap-3 text-gray-600">
                                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                1 Livre PDF Haute Qualité
                            </li>
                            <li className="flex items-center gap-3 text-gray-600">
                                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                Personnalisation complète
                            </li>
                            <li className="flex items-center gap-3 text-gray-600">
                                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                Version Audio Incluse
                            </li>
                        </ul>
                        <button className="block w-full py-4 rounded-xl border-2 border-gray-200 text-center font-bold text-gray-900 hover:border-gray-900 transition-colors">
                            Créer un livre
                        </button>
                    </div>

                    {/* Card 2: Subscription (Featured) */}
                    <div className="bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-800 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAIRE</div>
                        <div className="mb-6">
                            <span className="text-orange-400 font-bold tracking-wider text-sm uppercase">Club Kusoma</span>
                            <h3 className="text-3xl font-bold text-white mt-2">5.000 FCFA <span className="text-lg text-gray-400 font-normal">/ mois</span></h3>
                        </div>
                        <ul className="space-y-4 mb-8 flex-grow">
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">✓</div>
                                <span className="text-white font-medium">Lecture illimitée en ligne</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">✓</div>
                                <span className="text-white font-medium">1 Crédit PDF / mois (Valeur 3000F)</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">✓</div>
                                Accès aux histoires exclusives
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">✓</div>
                                Annulable à tout moment
                            </li>
                        </ul>
                        <button className="block w-full py-4 rounded-xl bg-orange-500 text-center font-bold text-white hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/25">
                            Rejoindre le Club
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
