import PageLayout from '../components/PageLayout';

export default function PrivacyPage() {
    return (
        <PageLayout title="Politique de Confidentialité">
            <p className="italic text-sm text-gray-500 mb-8">Dernière mise à jour : Janvier 2026</p>

            <h3>1. Introduction</h3>
            <p>
                Chez KusomaKids (produit de TEKKI Studio), nous prenons très au sérieux la confidentialité des données de vos enfants.
                Cette politique explique comment nous collectons, utilisons et protégeons vos informations.
            </p>

            <h3>2. Données collectées</h3>
            <p>
                Pour créer des histoires personnalisées, nous collectons les informations suivantes :
            </p>
            <ul>
                <li><strong>Informations sur l'enfant :</strong> Prénom, Âge, Genre.</li>
                <li><strong>Photos :</strong> La photo de l'enfant est utilisée <u>uniquement</u> par notre algorithme d'IA pour générer les illustrations du livre.</li>
                <li><strong>Informations parentales :</strong> Email (pour la livraison du livre) et données de paiement (traitées de manière sécurisée par Stripe/Wave, nous ne stockons pas vos numéros de carte).</li>
            </ul>

            <h3>3. Utilisation des Photos & IA</h3>
            <p>
                Les photos que vous téléchargez sont traitées temporairement pour la génération des images du livre.
                Elles ne sont pas utilisées à des fins publicitaires ni revendues à des tiers.
                Une fois le livre généré, les photos sources peuvent être supprimées de nos serveurs sur simple demande.
            </p>

            <h3>4. Sécurité</h3>
            <p>
                Nous mettons en œuvre des mesures de sécurité techniques pour protéger vos données contre l'accès non autorisé.
                Votre mot de passe est crypté et vos paiements sont sécurisés par le protocole SSL.
            </p>

            <h3>5. Vos Droits</h3>
            <p>
                Conformément aux réglementations en vigueur (notamment au Sénégal et le RGPD si applicable), vous disposez d'un droit d'accès, de modification et de suppression de vos données.
                Pour exercer ce droit, contactez-nous à <a href="mailto:privacy@kusomakids.com" className="text-orange-600">privacy@kusomakids.com</a>.
            </p>

            <h3>6. Éditeur</h3>
            <p>
                KusomaKids est édité par TEKKI Studio, Fabrique de Marques E-commerce (DNVB), Dakar, Sénégal.
            </p>
        </PageLayout>
    );
}
