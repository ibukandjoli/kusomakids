export default function FAQPage() {
    const faqs = [
        {
            q: "Comment fonctionne la personnalisation ?",
            a: "C'est très simple ! Vous choisissez une histoire, vous entrez le prénom et l'âge de votre enfant, et vous téléchargez une photo. Notre IA se charge de générer les illustrations et d'adapter le texte en quelques secondes."
        },
        {
            q: "Quel est le délai de livraison ?",
            a: "Pour les livres numériques (PDF), la livraison est immédiate après la génération. Vous recevez un lien de téléchargement par email."
        },
        {
            q: "Puis-je imprimer le livre moi-même ?",
            a: "Absolument ! Le format PDF haute définition est conçu pour être imprimé facilement chez vous ou chez un imprimeur professionnel."
        },
        {
            q: "L'abonnement Club Kusoma est-il sans engagement ?",
            a: "Oui, totalement sans engagement. Vous pouvez annuler votre abonnement à tout moment depuis votre espace personnel."
        },
        {
            q: "Quels moyens de paiement acceptez-vous ?",
            a: "Nous acceptons les cartes bancaires (Visa, Mastercard) ainsi que les paiements mobiles (Wave, Orange Money) via notre partenaire sécurisé."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="container mx-auto px-4 max-w-3xl">
                <h1 className="text-4xl font-bold text-gray-900 mb-12 text-center">Foire Aux Questions</h1>

                <div className="space-y-6">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{faq.q}</h3>
                            <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
