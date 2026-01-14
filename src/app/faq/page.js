import PageLayout from '../components/PageLayout';
import Link from 'next/link';

export default function FAQPage() {
    return (
        <PageLayout title="Foire aux Questions">

            <div className="space-y-12">

                {/* Section 1: Général */}
                <section>
                    <h3 className="flex items-center gap-2 text-2xl font-bold text-gray-900 mb-6 border-b pb-2 border-gray-100">
                        <span>📚</span> À propos de nos livres
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-gray-900 text-lg mb-2">Pour quel âge sont adaptées les histoires ?</h4>
                            <p>Nos histoires sont principalement conçues pour les enfants de <strong>2 à 10 ans</strong>. Pour les plus petits (2-5 ans), c'est une merveilleuse histoire à lire le soir par les parents. Pour les plus grands (6-10 ans), c'est un excellent outil pour l'apprentissage de la lecture autonome grâce à nos textes adaptés.</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-lg mb-2">Quel est le format du livre ?</h4>
                            <p>Nous proposons pour l'instant des <strong>livres numériques au format PDF Haute Définition</strong>. Ce format est universel : vous pouvez le lire sur tablette, smartphone, ordinateur ou télévision. C'est idéal pour avoir toute votre bibliothèque dans votre poche lors de vos déplacements !</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-lg mb-2">Est-ce que je peux imprimer le livre ?</h4>
                            <p><strong>Oui, absolument !</strong> Le fichier PDF que vous recevez est en très haute qualité (300 DPI). Vous pouvez l'imprimer sur votre imprimante personnelle ou le faire imprimer et relier chez un imprimeur professionnel près de chez vous pour un rendu "magasin".</p>
                        </div>
                    </div>
                </section>

                {/* Section 2: Personnalisation */}
                <section>
                    <h3 className="flex items-center gap-2 text-2xl font-bold text-gray-900 mb-6 border-b pb-2 border-gray-100">
                        <span>✨</span> La Magie de la Personnalisation
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-gray-900 text-lg mb-2">Comment fonctionne la personnalisation ?</h4>
                            <p>C'est très simple et cela prend moins de 2 minutes :
                                <ol className="list-decimal list-inside mt-2 space-y-1 pl-4">
                                    <li>Vous choisissez une histoire qui vous plaît.</li>
                                    <li>Vous importez une photo de votre enfant et renseignez son prénom.</li>
                                    <li>Notre IA analyse la photo et génère les illustrations en intégrant le visage de votre enfant !</li>
                                </ol>
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-lg mb-2">Puis-je modifier l'histoire ?</h4>
                            <p>Oui ! Avant la finalisation, vous pouvez lire l'histoire et modifier certains passages du texte si vous souhaitez ajouter une touche personnelle ou adapter le vocabulaire.</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-lg mb-2">Que faites-vous des photos de mes enfants ?</h4>
                            <p>La sécurité est notre priorité. Les photos sont utilisées <strong>uniquement</strong> par nos algorithmes pour générer le livre. Elles ne sont ni vendues, ni partagées, ni utilisées à des fins publicitaires. Vous pouvez demander leur suppression complète de nos serveurs à tout moment.</p>
                        </div>
                    </div>
                </section>

                {/* Section 3: Club & Tarifs */}
                <section>
                    <h3 className="flex items-center gap-2 text-2xl font-bold text-gray-900 mb-6 border-b pb-2 border-gray-100">
                        <span>👑</span> Club Kusoma & Tarifs
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-gray-900 text-lg mb-2">Quels sont les avantages du Club Kusoma ?</h4>
                            <p>Le Club est notre offre d'abonnement VIP à <strong>6.500 FCFA / mois</strong>. Il vous donne :
                                <ul className="list-disc list-inside mt-2 space-y-1 pl-4">
                                    <li>Un accès illimité à toute la bibliothèque en lecture streaming.</li>
                                    <li>Les versions AUDIO de toutes les histoires.</li>
                                    <li><strong>1 Crédit de téléchargement PDF offert chaque mois</strong> (valeur 3.000 F).</li>
                                    <li>-50% sur tous les achats de livres supplémentaires.</li>
                                </ul>
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-lg mb-2">Puis-je annuler mon abonnement ?</h4>
                            <p>Oui, le Club Kusoma est <strong>sans engagement</strong>. Vous pouvez vous désabonner à tout moment en un clic depuis Votre Espace. L'accès restera actif jusqu'à la fin de la période payée.</p>
                        </div>
                    </div>
                </section>

                {/* Section 4: Support */}
                <section>
                    <h3 className="flex items-center gap-2 text-2xl font-bold text-gray-900 mb-6 border-b pb-2 border-gray-100">
                        <span>🆘</span> Aide & Support
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-gray-900 text-lg mb-2">J'ai un problème avec ma commande</h4>
                            <p>Pas de panique ! Notre équipe est là pour vous. Si vous n'avez pas reçu votre PDF ou si vous rencontrez un souci technique, contactez-nous directement par email à <strong>coucou@kusomakids.com</strong>.</p>
                        </div>
                    </div>
                </section>

            </div>

        </PageLayout>
    );
}
