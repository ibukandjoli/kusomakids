import Image from 'next/image';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-6">Notre Mission</h1>
                    <p className="text-xl text-gray-600 font-medium">
                        "Faire de chaque enfant africain le héros de sa propre histoire."
                    </p>
                </div>

                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl mb-16">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Pourquoi Kusoma Kids ?</h2>
                    <div className="prose prose-lg text-gray-600">
                        <p className="mb-4">
                            Nous sommes partis d'un constat simple : il est difficile de trouver des livres pour enfants de qualité où les héros ressemblent vraiment à nos enfants, vivent dans nos villes et portent nos noms.
                        </p>
                        <p className="mb-4">
                            La représentation est cruciale pour la confiance en soi. Un enfant qui se voit accomplir de grandes choses dans un livre commence à croire qu'il peut les accomplir dans la vraie vie.
                        </p>
                        <p>
                            C'est pourquoi nous avons créé Kusoma Kids. En alliant la puissance de l'Intelligence Artificielle à la richesse de la culture africaine, nous permettons à chaque parent de créer un conte unique, magique et profondément personnel.
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">L'équipe</h2>
                    <div className="flex justify-center gap-8">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden relative">
                                {/* Placeholder for founder image */}
                                <div className="absolute inset-0 flex items-center justify-center text-3xl">👨🏾‍💻</div>
                            </div>
                            <h3 className="font-bold text-gray-900">Tekki Group</h3>
                            <p className="text-sm text-gray-500">Fondateurs</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
