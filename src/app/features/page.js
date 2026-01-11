export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-6">Des histoires magiques, conçues pour votre enfant</h1>
                    <p className="text-lg text-gray-600">
                        Découvrez comment Kusoma Kids transforme la lecture en une aventure personnelle et éducative.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
                    <div className="order-2 md:order-1">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">1. Personnalisation Avancée</h2>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Grâce à notre technologie d'IA générative, chaque livre est unique. Non seulement le prénom de votre enfant est intégré, mais son apparence (coupe de cheveux, couleur de peau) et ses passions sont tissées dans l'intrigue et les illustrations.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-gray-700">
                                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">✓</span>
                                Visage et prénom de l'enfant
                            </li>
                            <li className="flex items-center gap-3 text-gray-700">
                                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">✓</span>
                                Choix des thèmes préférés
                            </li>
                        </ul>
                    </div>
                    <div className="order-1 md:order-2 bg-white p-8 rounded-3xl shadow-xl h-64 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🎨</div>
                            <p className="font-bold text-gray-400">Illustration de Personnalisation</p>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
                    <div className="bg-white p-8 rounded-3xl shadow-xl h-64 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🌍</div>
                            <p className="font-bold text-gray-400">Illustration Culturelle</p>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">2. Ancrage Culturel Fort</h2>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Nos histoires se déroulent dans des environnements familiers ou magiques inspirés de l'Afrique. Fini les stéréotypes : ici, les héros mangent du thieboudienne, vivent à Dakar, Abidjan ou Nairobi, et rencontrent des créatures de notre folklore.
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">3. Éducatif et Ludique</h2>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Plus qu'un simple divertissement, nos livres véhiculent des valeurs positives : courage, amitié, respect de la nature et curiosité. Chaque histoire est une opportunité d'apprentissage.
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-xl h-64 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-6xl mb-4">📚</div>
                            <p className="font-bold text-gray-400">Illustration Éducation</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
