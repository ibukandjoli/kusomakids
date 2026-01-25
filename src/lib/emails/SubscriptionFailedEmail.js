export const SubscriptionFailedEmail = ({ userName, actionUrl }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Action requise : Votre abonnement Club Kusoma</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #4b5563; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fdfbf7;">
    
    <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); padding: 40px 30px;">
        
        <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 48px; display: block; margin-bottom: 10px;">⚠️</span>
            <h1 style="color: #dc2626; font-size: 24px; margin: 0;">Oups, petit problème de paiement</h1>
        </div>

        <p style="font-size: 16px;">Bonjour <strong>${userName || 'Membre du Club'}</strong>,</p>

        <p style="font-size: 16px;">Nous avons tenté de renouveler votre abonnement au <strong>Club Kusoma</strong> aujourd'hui, mais la transaction n'a pas abouti (probablement une carte expirée ou des fonds insuffisants).</p>

        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 30px 0; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; color: #991b1b; font-size: 16px;">
                Vos avantages sont temporairement suspendus.
            </p>
            <p style="margin: 5px 0 0 0; color: #b91c1c; font-size: 14px;">
                Mettez à jour vos informations de paiement pour réactiver immédiatement votre crédit mensuel et l'accès illimité.
            </p>
        </div>

        <div style="text-align: center; margin: 40px 0;">
            <a href="${actionUrl || 'https://kusomakids.com/dashboard/profile'}" style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 16px 32px; border-radius: 99px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.25);">
                Mettre à jour mon paiement 💳
            </a>
        </div>

        <p style="font-size: 16px;">
            Ne vous inquiétez pas, nous réessaierons automatiquement dans quelques jours. Si vous avez changé d'avis, vous n'avez rien à faire.
        </p>

        <p style="font-size: 16px;">Besoin d'aide ? Répondez simplement à cet email.</p>

        <p style="font-size: 16px; margin-top: 30px;">
            À bientôt,<br>
            L'équipe KusomaKids
        </p>

    </div>

    <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #9ca3af;">
        © ${new Date().getFullYear()} KusomaKids.
    </div>
</body>
</html>
`;
