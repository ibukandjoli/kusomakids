export const WelcomeEmail = ({ userName }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bienvenue dans la famille KusomaKids !</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #FF6B00; font-size: 28px;">Bienvenue dans la famille ! 🦁</h1>
    </div>

    <p>Bonjour ${userName || 'cher parent'},</p>

    <p>Je suis <strong>Ibuka</strong>, le papa de Soraya et le fondateur de KusomaKids. Je suis tellement heureux de vous accueillir parmi nous !</p>

    <p>J'ai créé KusomaKids parce que je voulais que ma fille puisse grandir en se voyant comme l'héroïne de ses propres aventures, fière de ses cheveux, de sa peau et de son héritage.</p>

    <p>Aujourd'hui, c'est au tour de votre enfant de devenir le héros. ✨</p>

    <div style="background-color: #FFFAF0; border-left: 4px solid #FF6B00; padding: 20px; margin: 30px 0; border-radius: 8px;">
        <p style="margin: 0; font-weight: bold; color: #D65A00;">🎉 Votre aventure commence maintenant !</p>
        <p style="margin: 10px 0 0;">Connectez-vous pour personnaliser votre première histoire en quelques secondes.</p>
    </div>

    <p>Si vous avez la moindre question, n'hésitez pas à répondre directement à cet e-mail. Je lis (et réponds) à tout le monde !</p>

    <p>À très vite pour de la magie,</p>

    <p style="margin-top: 30px;">
        <strong>Ibuka</strong><br>
        Papa de Soraya & Fondateur de KusomaKids 👨🏾‍👧🏾
    </p>

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #888;">
        © ${new Date().getFullYear()} KusomaKids. Fait avec ❤️ pour nos enfants.
    </div>
</body>
</html>
`;
