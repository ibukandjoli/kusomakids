export const OrderConfirmationEmail = ({ childName, bookTitle, userEmail }) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #FFF9F5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .icon { font-size: 60px; text-align: center; margin-bottom: 20px; }
        .button { display: inline-block; background-color: #FF6B35; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; margin: 20px 0; }
        .button-secondary { display: inline-block; background-color: #FFF3E0; color: #FF6B35; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; border: 2px solid #FF6B35; }
        .info-box { background-color: #FFF3E0; border-left: 4px solid #FF6B35; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .footer { background-color: #f8f8f8; padding: 20px; text-align: center; color: #666666; font-size: 12px; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; color: #92400e; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Commande Confirmée !</h1>
        </div>
        <div class="content">
            <div class="icon">✨</div>
            
            <h2 style="color: #1a1a1a; text-align: center;">Merci pour votre commande !</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
                L'histoire de <strong>${childName}</strong>, intitulée <em>"${bookTitle}"</em>, est en cours de finalisation.
            </p>
            
            <div class="info-box">
                <h3 style="color: #92400e; margin-top: 0; font-size: 18px;">🎨 Que se passe-t-il maintenant ?</h3>
                <p style="color: #92400e; font-size: 14px; margin: 10px 0;">
                    Nos artistes magiques finalisent les <strong>10 illustrations personnalisées</strong> avec le visage de ${childName}.
                </p>
                <p style="color: #92400e; font-size: 14px; margin: 10px 0;">
                    ⏱️ <strong>Vous recevrez le lien de téléchargement du PDF dans 2-3 minutes</strong> par email.
                </p>
            </div>

            <div style="background-color: #E8F5E9; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: #2E7D32; margin-top: 0; font-size: 18px;">🔐 En attendant, activez votre compte !</h3>
                <p style="color: #2E7D32; font-size: 14px; margin: 10px 0;">
                    Créez votre compte KusomaKids pour :
                </p>
                <ul>
                    <li>📚 Retrouver tous vos PDFs en un clic</li>
                    <li>🎧 Lire l'histoire en streaming avec audio</li>
                    <li>✨ Créer de nouvelles histoires magiques</li>
                    <li>🏆 Rejoindre le Club Kusoma (histoires illimitées)</li>
                </ul>
                <div style="text-align: center; margin-top: 15px;">
                    <a href="https://www.kusomakids.com/set-password?email=${encodeURIComponent(userEmail)}" class="button-secondary">Définir mon mot de passe →</a>
                </div>
            </div>

            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
                Des questions ? Contactez-nous à <a href="mailto:coucou@kusomakids.com" style="color: #FF6B35;">coucou@kusomakids.com</a>
            </p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} KusomaKids. Créateur d'Histoires Magiques.</p>
        </div>
    </div>
</body>
</html>
  `;
};
