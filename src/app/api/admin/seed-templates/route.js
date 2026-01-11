
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Client (Admin context if needed, but using public vars for now as RLS policy allows insert/select if open or via service role)
// For seeding, anonymity might be an issue if RLS is strict. assuming service role or open policy for now based on previous instructions.
// Better to use service role key for seeding if available, but we only have anon. we added a policy "Templates are viewable by everyone" but insert might be restricted.
// TEMPORARY: relying on anon key with likely permissive setup during dev or manual SQL run preferred.
// Actually, we will return the SQL to the user to run in Supabase Editor, OR try to insert if policies allow.
// Let's try to insert using the client.

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TEMPLATES_10_PAGES = [
    {
        theme_slug: "L'École",
        title_template: "{childName} devient un(e) Grand(e) !",
        description: "Une histoire douce pour dédramatiser la rentrée des classes.",
        content_json: {
            title: "{childName} devient un(e) Grand(e) !",
            synopsis: "Une aventure rassurante pour la première rentrée.",
            pages: [
                { pageNumber: 1, text: "Il était une fois, un beau matin de septembre, le soleil se levait doucement sur la maison de {childName}. C'était un jour très spécial, écrit en rouge sur le calendrier.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} waking up in a sunny bedroom, stretching arms, calendar on wall." },
                { pageNumber: 2, text: "Maman entra dans la chambre avec un grand sourire. 'Debout mon grand ! Aujourd'hui, c'est ta première rentrée !' {childName} sentit son cœur battre un peu vite.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} sitting in bed, mother entering with clothes, warm lighting." },
                { pageNumber: 3, text: "{childName} enfila ses plus beaux habits. Il regarda son nouveau sac à dos posé sur la chaise. Il était beau, mais il semblait un peu gros pour ses épaules.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} putting on a colorful backpack, looking in the mirror, slightly nervous." },
                { pageNumber: 4, text: "Sur le chemin, {childName} tenait fort la main de Papa. Les rues étaient remplies d'autres enfants avec des cartables colorés. Tout le monde allait au même endroit.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} walking on city sidewalk holding father's hand, other kids around." },
                { pageNumber: 5, text: "Devant la grande grille de l'école, {childName} s'arrêta net. Il y avait beaucoup de bruit, des cris et des rires. 'Je ne veux pas y aller,' murmura-t-il.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} stopping in front of a colorful school gate, looking hesitant." },
                { pageNumber: 6, text: "La maîtresse s'approcha. Elle avait un sourire gentil et des yeux qui pétillaient. 'Bonjour {childName}, bienvenue dans ton nouveau royaume !' dit-elle doucement.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} meeting a kind female teacher kneeling down, school background." },
                { pageNumber: 7, text: "{childName} entra timidement dans la classe. C'était magique ! Il y avait des dessins aux murs, des coins jeux et des livres partout. Les couleurs étaient magnifiques.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} looking amazed inside a colorful classroom, toys and books around." },
                { pageNumber: 8, text: "Dans le coin construction, un autre enfant lui tendit une brique rouge. 'Tu veux jouer avec moi ?' demanda-t-il. {childName} prit la brique et sourit.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} playing blocks with another child, smiling." },
                { pageNumber: 9, text: "La journée passa à toute vitesse. Ils ont chanté, dessiné et joué dehors. {childName} avait complètement oublié sa peur du matin.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} painting or drawing at a table with other kids, happy expression." },
                { pageNumber: 10, text: "Le soir, quand Papa revint, {childName} courut vers lui. 'J'ai adoré l'école ! Je peux y retourner demain ?' Il était fier d'être devenu un grand.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} running to hug father at school gate, sunset lighting, happy." }
            ]
        }
    },
    {
        theme_slug: "Les Cheveux",
        title_template: "Les Cheveux Magiques de {childName}",
        description: "Pour apprendre à aimer sa chevelure naturelle.",
        content_json: {
            title: "Les Cheveux Magiques de {childName}",
            synopsis: "Une histoire d'acceptation et de beauté.",
            pages: [
                { pageNumber: 1, text: "Il était une fois, un samedi matin pas comme les autres. C'était le jour de la coiffure chez {childName}. Mais {childName} se cachait sous sa couette.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} hiding under duvet in bed, only eyes visible." },
                { pageNumber: 2, text: "'Je ne veux pas me coiffer !' cria {childName}. 'Mes cheveux sont trop durs, ils s'emmêlent tout le temps ! Je veux des cheveux tout lisses.'", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} looking unhappy in front of a mirror, touching hair." },
                { pageNumber: 3, text: "Maman s'assit près de lui avec le peigne et de l'huile parfumée. 'Sais-tu que tes cheveux sont magiques ?' demanda-t-elle mystérieusement.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} looking curious at mother holding hair oil bottle." },
                { pageNumber: 4, text: "'Magiques ?' {childName} sortit le nez de sa couette. 'Oui, regarde le ciel,' dit Maman. 'Tes cheveux sont comme les nuages, ils peuvent prendre toutes les formes.'", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} looking out window at fluffy clouds in shapes." },
                { pageNumber: 5, text: "'Les cheveux lisses ne font que tomber,' continua Maman. 'Mais les tiens peuvent monter vers le soleil, faire des couronnes ou des tresses royales.'", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} imagining hair styled in a crown shape, glowing." },
                { pageNumber: 6, text: "{childName} s'assit enfin entre les jambes de Maman. Elle commença à démêler doucement, mèche par mèche, avec amour et patience.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} sitting on floor while mother styles hair, comfortable atmosphere." },
                { pageNumber: 7, text: "'On met des perles aujourd'hui ?' {childName} choisit des perles dorées et bleues. C'était comme décorer un trésor précieux.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} picking colorful beads from a bowl." },
                { pageNumber: 8, text: "Petit à petit, une œuvre d'art apparut. Des tresses magnifiques dessinaient des chemins sur sa tête. {childName} ne sentait plus aucune douleur.", imagePrompt: "Close up of {childName}'s hair being braided with intricate patterns." },
                { pageNumber: 9, text: "Quand ce fut fini, {childName} courut au miroir. 'Wouah !' C'était magnifique. Il/Elle tourna la tête pour faire cliqueter les perles.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} admiring self in mirror, shaking head, beads flying." },
                { pageNumber: 10, text: "{childName} fit un grand sourire. Ses cheveux n'étaient pas durs, ils étaient forts et beaux. C'était sa couronne naturelle, unique au monde.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} posing proudly like a little king/queen." }
            ]
        }
    },
    {
        theme_slug: "La Panne de Courant",
        title_template: "{childName} et la Panne de Courant",
        description: "Stimuler la créativité sans écrans.",
        content_json: {
            title: "{childName} et la Panne de Courant",
            synopsis: "Une aventure dans le noir pour retrouver l'imagination.",
            pages: [
                { pageNumber: 1, text: "Il était une fois, un soir d'hiver, {childName} regardait son dessin animé préféré sur la tablette. Les couleurs dansaient sur l'écran.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} staring hypnotized at a tablet screen in a living room." },
                { pageNumber: 2, text: "Soudain, CLAC ! Tout devint noir. La télé s'éteignit, la lampe du salon aussi. C'était le silence total. Une panne de courant !", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} looking surprised in a dark room, moonlight coming from window." },
                { pageNumber: 3, text: "'Maman ? Papa ?' appela {childName}. La voix tremblait un peu. Le noir, c'est mystérieux mais ça fait un peu peur aussi.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} looking around in the dark, slightly scared." },
                { pageNumber: 4, text: "Papa alluma une grosse bougie. La flamme dansa et projeta des ombres immenses sur les murs. 'L'aventure commence !' dit-il.", imagePrompt: "Father lighting a candle, warm glow illuminating {childName}'s face." },
                { pageNumber: 5, text: "{childName} s'approcha de la lumière. 'Regarde,' dit-il en mettant ses mains devant la flamme. 'C'est un loup !' Une ombre apparut sur le mur.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} making hand shadow puppets on the wall." },
                { pageNumber: 6, text: "Maman apporta tous les coussins du canapé. 'Vite, construisons une forteresse avant que les monstres n'arrivent !' {childName} rigola.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} and parents building a pillow fort in candlelight." },
                { pageNumber: 7, text: "Ils s'installèrent dans la cabane de coussins. C'était douillet. Papa raconta une histoire de pirates murmureé à l'oreille.", imagePrompt: "Family huddled inside a pillow fort, cozy atmosphere, listening to story." },
                { pageNumber: 8, text: "{childName} ferma les yeux et vit le bateau pirate, la mer bleue et le trésor. C'était bien mieux qu'à la télé.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} with eyes closed, dreaming/imagining functionality." },
                { pageNumber: 9, text: "Soudain, BZZZT ! La lumière revint crûment. La télé se ralluma toute seule en faisant du bruit. {childName} plissa les yeux.", imagePrompt: "Room suddenly bright with electric light, {childName} squinting eyes, looking annoyed." },
                { pageNumber: 10, text: "'Éteins, s'il te plaît Papa,' dit {childName}. 'Je veux rester dans la cabane.' Ce soir-là, {childName} apprit que le noir est le meilleur ami des rêves.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} sleeping peacefully inside the pillow fort, candle blown out." }
            ]
        }
    },
    {
        theme_slug: "La Politesse",
        title_template: "Le Super-Pouvoir de {childName}",
        description: "L'importance du 'Bonjour' et du lien social.",
        content_json: {
            title: "Le Super-Pouvoir de {childName}",
            synopsis: "Découvrir la magie d'un simple bonjour.",
            pages: [
                { pageNumber: 1, text: "Il était une fois, un quartier très occupé. {childName} marchait vite, très vite, en tenant la main de Maman. Il fallait se dépêcher.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} walking fast on a busy african street, looking down." },
                { pageNumber: 2, text: "Ils entrèrent dans l'épicerie. {childName} alla direct vers les bonbons sans regarder le vieux monsieur à la caisse. Il/Elle avait la tête baissée.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} looking at candy shelf, ignoring the shopkeeper." },
                { pageNumber: 3, text: "Le vieux monsieur soupira. Il avait l'air triste et gris. Tout le magasin semblait un peu sombre et froid.", imagePrompt: "Shopkeeper looking sad and tired behind the counter, gloomy atmosphere." },
                { pageNumber: 4, text: "En sortant, Maman s'arrêta. '{childName}, tu as oublié ton super-pouvoir.' {childName} la regarda, étonné(e). 'Je n'ai pas de super-pouvoir.'", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} looking confused at mother on the sidewalk." },
                { pageNumber: 5, text: "'Si,' dit Maman. 'Le Bonjour. C'est un mot magique qui allume la lumière dans le cœur des gens. Essaie avec la voisine.'", imagePrompt: "Mother pointing to a neighbor lady sitting on a bench." },
                { pageNumber: 6, text: "{childName} s'approcha de la dame. Il prit une grande respiration. 'Bonjour Madame !' dit-il d'une voix claire.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} saying hello to the lady, looking brave." },
                { pageNumber: 7, text: "Aussitôt, le visage de la dame s'illumina. Un grand sourire apparut. 'Bonjour mon petit ! Quel beau sourire !'", imagePrompt: "The neighbor lady smiling widely, happy reaction." },
                { pageNumber: 8, text: "{childName} sentit une chaleur dans son ventre. C'était agréable. Il/Elle essaya encore avec le monsieur qui balayait. 'Bonjour Tonton !'", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} waving at a street sweeper." },
                { pageNumber: 9, text: "Le monsieur répondit en riant. Tout le monde semblait plus gentil, plus beau. Les couleurs de la rue devenaient plus vives.", imagePrompt: "Street scene becoming brighter and more colorful, people smiling." },
                { pageNumber: 10, text: "Ce jour-là, {childName} comprit que la politesse n'est pas une règle ennuyeuse. C'est la clé qui ouvre le cœur des autres.", imagePrompt: "A cute {childAge} year old {gender_en} named {childName} walking happily with mother, holding a candy, bright sunny day." }
            ]
        }
    }
];

export async function GET(request) {
    try {
        console.log("Seeding templates...");

        // 1. Clear existing templates (optional, be careful in prod)
        // await supabase.from('story_templates').delete().neq('id', 0); 

        const results = [];

        for (const template of TEMPLATES_10_PAGES) {
            const { error } = await supabase
                .from('story_templates')
                .upsert({
                    theme_slug: template.theme_slug,
                    title_template: template.title_template,
                    description: template.description,
                    content_json: template.content_json,
                    is_active: true
                }, { onConflict: 'theme_slug' });

            if (error) {
                console.error(`Error inserting ${template.theme_slug}:`, error);
                results.push({ theme: template.theme_slug, status: 'error', error });
            } else {
                results.push({ theme: template.theme_slug, status: 'success' });
            }
        }

        return NextResponse.json({ message: "Seeding complete", results });

    } catch (error) {
        console.error("Seeding error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
