export const WelcomeEmail = ({ userName }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bienvenue dans la famille KusomaKids !</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #4b5563; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fdfbf7;">
    
    <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); padding: 40px 30px;">
        
        <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 48px; display: block; margin-bottom: 10px;">🎉</span>
            <h1 style="color: #ea580c; font-size: 26px; margin: 0;">Bienvenue dans la famille !</h1>
        </div>

        <p style="font-size: 16px;">Bonjour <strong>${userName || 'chère famille'}</strong> 👋🏼,</p>

        <p style="font-size: 16px;">Je me nomme <strong>Ibuka</strong>. Je suis le fondateur de KusomaKids, mais avant tout, je suis le papa de <strong>Soraya</strong>.</p>

        <p style="font-size: 16px;">Il n'y a pas si longtemps, je cherchais désespérément des histoires du soir où ma fille pourrait voir une héroïne qui lui ressemble. Je voulais qu'elle grandisse en se sachant capable de porter une cape magique, d'explorer les étoiles ou de vivre de grandes aventures.</p>

        <p style="font-size: 16px;">Face au manque de représentation dans les livres classiques, j'ai décidé de créer cette magie moi-même. C'est ainsi qu'est né <strong>KusomaKids</strong>.</p>

        <p style="font-size: 16px;">Aujourd'hui, je suis très ému de vous accueillir parmi nous. Que vous soyez papa, maman, tonton, tata ou grand-parent, si vous lisez ce message, c'est que nous partageons la même conviction :</p>

        <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 20px; margin: 30px 0; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; color: #9a3412; font-size: 18px; line-height: 1.4;">
                "Nos enfants méritent d'être les héros de leurs propres histoires. Ils méritent de se voir grands, forts et magiques."
            </p>
        </div>

        <p style="font-size: 16px;">Vous venez de faire le premier pas. Maintenant, place à la magie. N'attendez plus pour créer la toute première histoire dont votre petit trésor sera le personnage principal. Il/elle pourra voir son prénom et son visage prendre vie.</p>
        
        <p style="font-size: 16px;">J'ai hâte que vous voyiez ses yeux briller lorsqu'il/elle se découvrira dans l'aventure, ou entendra son prénom être dit lors de l'écoute audio de l'histoire.</p>

        <div style="text-align: center; margin: 40px 0;">
            <a href="https://kusomakids.com" style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 16px 32px; border-radius: 99px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(234, 88, 12, 0.25);">
                Créer ma première histoire magique ✨
            </a>
        </div>

        <p style="font-size: 16px;">Merci de faire partie de ce voyage avec nous. C'est un honneur de vous compter dans notre "village".</p>

        <p style="font-size: 16px;">Si vous avez la moindre question, ou juste envie de partager votre expérience, répondez simplement à cet email. Je vous lirai avec plaisir.</p>

        <p style="font-size: 16px; margin-top: 30px;">
            Chaleureusement,<br><br>
            <strong>Ibuka</strong><br>
            <span style="color: #6b7280; font-size: 14px;">Papa de Soraya & Fondateur de KusomaKids</span>
        </p>
    </div>

    <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #9ca3af;">
        © ${new Date().getFullYear()} KusomaKids. Fait avec ❤️ pour nos enfants.
    </div>
</body>
</html>
`;
