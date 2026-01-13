import PageLayout from '../components/PageLayout';

export default function SupportPage() {
    return (
        <PageLayout title="Support Client">
            <h3>Besoin d'aide ?</h3>
            <p>
                L'équipe de KusomaKids est là pour vous accompagner dans la création de vos histoires magiques. Si vous avez une question sur votre commande, le téléchargement de votre livre ou le fonctionnement du Club, n'hésitez pas à nous contacter.
            </p>

            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 my-8">
                <h4 className="text-orange-800 font-bold mb-2">💌 Contactez-nous par email</h4>
                <p className="mb-4">
                    Envoyez-nous un message à : <a href="mailto:hello@kusomakids.com" className="font-bold text-orange-600 hover:underline">hello@kusomakids.com</a>
                </p>
                <p className="text-sm text-gray-500">
                    Nous répondons généralement sous 24 à 48 heures ouvrées.
                </p>
            </div>

            <h3>Horaires d'ouverture</h3>
            <p>
                Notre service client est disponible du Lundi au Vendredi, de 9h à 18h (GMT).
            </p>

            <h3>Une question technique ?</h3>
            <p>
                Si vous rencontrez un problème avec le téléchargement de votre PDF, vérifiez d'abord votre dossier "Spams". Si le problème persiste, écrivez-nous en précisant votre numéro de commande (reçu par email).
            </p>

            <hr className="my-8 border-gray-100" />

            <p className="text-sm text-gray-400 italic">
                KusomaKids est un produit de TEKKI Studio, Dakar, Sénégal.
            </p>
        </PageLayout>
    );
}
