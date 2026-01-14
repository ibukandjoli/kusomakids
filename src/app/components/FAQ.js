'use client';

const faqs = [
    {
        question: "Pour quels âges sont adaptées les histoires ?",
        answer: "Nos histoires sont conçues pour les enfants de 2 à 10 ans. Chaque histoire indique une tranche d'âge spécifique pour vous guider."
    },
    {
        question: "Comment fonctionne la personnalisation ?",
        answer: "C'est très simple ! Vous choisissez une histoire, vous importez une photo de votre enfant et vous entrez son prénom et son âge. Notre technologie se charge d'intégrer son visage et son prénom dans les illustrations du livre."
    },
    {
        question: "Puis-je modifier l'histoire avant de l'acheter ?",
        answer: "Absolument. A l'étape de la prévisualisation de l'histoire générée, vous pouvez modifier le texte de chaque page de l'histoire pour qu'il colle parfaitement à la réalité de votre enfant."
    },
    {
        question: "Quels sont les avantages du Club Kusoma ?",
        answer: "Le Club offre un accès illimité à la lecture en ligne (audio inclus), 1 livre PDF gratuit par mois à garder à vie, 50% de réduction sur les achats d'autres livres PDF, et l'accès exclusif aux nouveautés."
    },
    {
        question: "Quel est le format du livre ?",
        answer: "Nous proposons des livres numériques au format PDF haute définition, parfaits pour être lus sur tablette, ordinateur ou smartphone, et même imprimés, si vous le désirez."
    }
];

export default function FAQ() {
    return (
        <section id="faq" className="py-20 bg-orange-50 border-t border-orange-100">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Questions Fréquentes</h2>
                    <p className="text-gray-600">Tout ce que vous devez savoir sur KusomaKids.</p>
                </div>

                <div className="space-y-6">
                    {faqs.map((faq, i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 hover:shadow-md transition-shadow">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">{faq.question}</h3>
                            <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
