import PageLayout from '../components/PageLayout';

export default function TermsPage() {
    return (
        <PageLayout title="Conditions Générales (CGV/CGU)">
            <div className="prose prose-lg prose-orange max-w-none text-gray-600">
                <p className="italic text-sm text-gray-500 mb-8">Applicables au 1er Janvier 2026</p>

                <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Objet</h3>
                <p>
                    Les présentes Conditions Générales de Vente et d'Utilisation (CGV/CGU) régissent l'utilisation du site KusomaKids et la vente de livres numériques personnalisés par TEKKI Studio.
                </p>

                <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Produits & Services</h3>
                <p>
                    KusomaKids propose la création et la vente de livres pour enfants au format numérique (PDF) générés par Intelligence Artificielle.
                    Le "Club Kusoma" est un service d'abonnement mensuel donnant accès à la bibliothèque en ligne.
                </p>

                <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Prix et Paiement</h3>
                <p>
                    Les prix sont indiqués en Francs CFA (XOF). TEKKI Studio se réserve le droit de modifier ses prix à tout moment.
                    Le paiement est exigible immédiatement à la commande.
                </p>

                <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Livraison</h3>
                <p>
                    Les produits étant numériques, la livraison s'effectue par voie électronique (email ou lien de téléchargement) immédiatement après la finalisation de la génération du livre.
                </p>

                <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Droit de Rétractation</h3>
                <p>
                    Conformément aux dispositions légales relatives aux contenus numériques fournis sur un support immatériel et aux produits personnalisés, <strong>le droit de rétractation ne peut être exercé</strong> une fois la commande validée et le processus de génération commencé.
                </p>

                <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Propriété Intellectuelle</h3>
                <p>
                    Tous les éléments du site KusomaKids (textes, images, technologies) sont la propriété exclusive de TEKKI Studio.
                    L'achat d'un livre vous confère un droit d'usage privé et non commercial.
                </p>

                <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Responsabilité</h3>
                <p>
                    TEKKI Studio ne saurait être tenu responsable des interruptions de service liées à la maintenance technique ou aux défaillances du réseau internet.
                </p>

                <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Contact</h3>
                <p>
                    Pour toute réclamation : <a href="mailto:coucou@kusomakids.com" className="font-bold text-orange-600 hover:underline">coucou@kusomakids.com</a>
                </p>
            </div>
        </PageLayout>
    );
}
