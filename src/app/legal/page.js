import PageLayout from '../components/PageLayout';

export default function LegalPage() {
    return (
        <PageLayout title="Mentions Légales">
            <h3>1. Éditeur du Site</h3>
            <p>
                Le site <strong>KusomaKids</strong> est édité par la société <strong>TEKKI Studio</strong>.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
                <li><strong>Activité :</strong> Fabrique de Marques E-commerce Africaines (DNVB)</li>
                <li><strong>Siège Social :</strong> Dakar, Sénégal</li>
                <li><strong>Fondateur & Directeur de la Publication :</strong> Ibuka Ndjoli</li>
                <li><strong>Email de contact :</strong> hello@kusomakids.com</li>
            </ul>

            <h3>2. Hébergement</h3>
            <p>
                Le site est hébergé par <strong>Vercel Inc.</strong><br />
                340 S Lemon Ave #4133<br />
                Walnut, CA 91789<br />
                États-Unis
            </p>

            <h3>3. Données Personnelles</h3>
            <p>
                Le traitement des données personnelles effectuées sur ce site a fait l'objet d'une attention particulière conformément aux réglementations locales.
                Pour en savoir plus, consultez notre <a href="/privacy" className="text-orange-600 font-bold">Politique de Confidentialité</a>.
            </p>

            <h3>4. Propriété Intellectuelle</h3>
            <p>
                La marque KusomaKids et le contenu du site sont protégés par le droit d'auteur et le droit des marques.
                Toute reproduction non autorisée est interdite.
            </p>
        </PageLayout>
    );
}
