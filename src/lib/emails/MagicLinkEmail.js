export const MagicLinkEmail = ({ magicLink }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Accédez à votre histoire KusomaKids</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #4b5563; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fdfbf7;">
    
    <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); padding: 40px 30px; text-align: center;">
        
        <div style="margin-bottom: 30px;">
            <span style="font-size: 48px; display: block; margin-bottom: 10px;">🗝️</span>
            <h1 style="color: #ea580c; font-size: 26px; margin: 0;">Votre clé magique est arrivée !</h1>
        </div>

        <p style="font-size: 16px; margin-bottom: 30px;">
            Votre commande est bien validée. Pour accéder à votre espace personnel et retrouver toutes vos histoires, cliquez simplement sur le bouton ci-dessous.
        </p>

        <div style="margin: 40px 0;">
            <a href="${magicLink}" style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 16px 32px; border-radius: 99px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(234, 88, 12, 0.25);">
                Accéder à mon espace
            </a>
        </div>

        <p style="font-size: 14px; color: #6b7280;">
            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
            <a href="${magicLink}" style="color: #ea580c; text-decoration: underline; word-break: break-all;">${magicLink}</a>
        </p>
    </div>

    <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #9ca3af;">
        © ${new Date().getFullYear()} KusomaKids. Fait avec ❤️ pour nos enfants.
    </div>
</body>
</html>
`;
