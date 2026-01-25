export const SubscriptionSuccessEmail = ({ userName, nextBillingDate }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Votre abonnement Club Kusoma est renouvelé !</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #4b5563; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fdfbf7;">
    
    <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); padding: 40px 30px;">
        
        <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 48px; display: block; margin-bottom: 10px;">🌟</span>
            <h1 style="color: #ea580c; font-size: 24px; margin: 0;">L'aventure continue !</h1>
        </div>

        <p style="font-size: 16px;">Bonjour <strong>${userName || 'Membre du Club'}</strong>,</p>

        <p style="font-size: 16px;">Bonne nouvelle ! Votre abonnement au <strong>Club Kusoma</strong> a été renouvelé avec succès pour un mois de plus.</p>

        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 30px 0; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; color: #166534; font-size: 18px;">
                ✅ 1 Nouveau crédit PDF ajouté
            </p>
            <p style="margin: 5px 0 0 0; color: #15803d; font-size: 14px;">
                Vous pouvez télécharger dès maintenant une nouvelle histoire complète (avec les 10 illustrations personnalisées).
            </p>
        </div>

        <p style="font-size: 16px;">
            Pour rappel, en tant que membre, vous profitez toujours de :
        </p>
        <ul style="font-size: 16px; color: #374151;">
            <li>Lecture illimitée de toutes les histoires en streaming (audio inclus)</li>
            <li>Accès prioritaire aux nouvelles histoires</li>
            <li>Tarif réduit (-50%) sur les PDF supplémentaires</li>
        </ul>

        <div style="text-align: center; margin: 40px 0;">
            <a href="https://kusomakids.com/dashboard" style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 16px 32px; border-radius: 99px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(234, 88, 12, 0.25);">
                Accéder à mon espace membre 🚀
            </a>
        </div>

        <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
            Votre prochain renouvellement aura lieu le ${nextBillingDate || 'mois prochain'}.<br>
            Vous pouvez gérer votre abonnement à tout moment depuis votre compte.
        </p>

    </div>

    <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #9ca3af;">
        © ${new Date().getFullYear()} KusomaKids. Fait avec ❤️ pour nos enfants.
    </div>
</body>
</html>
`;
