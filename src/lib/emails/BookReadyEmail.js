export const BookReadyEmail = ({ childName, bookTitle, previewUrl }) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Votre histoire est prête !</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fdfbf7; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-top: 40px; margin-bottom: 40px; }
        .header { background-color: #f97316; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 30px; text-align: center; }
        .button { display: inline-block; background-color: #f97316; color: #ffffff; padding: 16px 32px; border-radius: 99px; text-decoration: none; font-weight: bold; font-size: 18px; margin-top: 20px; }
        .footer { background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        .emoji { font-size: 48px; margin-bottom: 10px; display: block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: white; margin: 0; font-size: 28px;">L'aventure commence ! 📖</h1>
        </div>
        <div class="content">
            <span class="emoji">✨</span>
            <h2 style="color: #1f2937; margin-bottom: 20px;">Bonjour !</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                La magie a opéré. L'histoire unique de <strong>${childName}</strong>, intitulée <em>"${bookTitle}"</em>, est prête à être découverte.
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Installez-vous confortablement et plongez dans cette aventure personnalisée.
            </p>
            
            <a href="${previewUrl}" class="button">Télécharger le PDF 📥</a>
            
            <p style="margin-top: 40px; color: #9ca3af; font-size: 14px;">
                Vous pouvez accéder à tout moment à vos histoires depuis votre <a href="https://kusomakids.com/dashboard" style="color: #f97316;">Tableau de bord</a>.
            </p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} KusomaKids. Fait avec ❤️ pour les petits héros.</p>
        </div>
    </div>
</body>
</html>
  `;
};
