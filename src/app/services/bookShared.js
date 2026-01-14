
import { STATIC_COVERS } from '@/lib/static-covers';

// Données simulées pour les livres (Fallback & Static Data)
export const booksData = [
    {
        id: "1",
        title: "Salif découvre les métiers",
        folder: "salif-metiers",
        price: 15000,
        ageRange: "4-6 ans",
        pages: 24,
        genre: "Éducation & Découverte",
        idealFor: "Garçon & Fille",
        description: "Dans cette aventure ludique et éducative, votre enfant découvre différents métiers passionnants. De pompier à médecin, en passant par agriculteur et artiste, votre enfant s'imagine dans chaque profession et développe sa curiosité pour le monde qui l'entoure.",
        longDescription: "\"Salif découvre les métiers\" est une aventure éducative qui emmène votre enfant à la découverte des différentes professions qui façonnent notre société.\n\nAu fil des pages, votre enfant incarnera tour à tour un pompier courageux, un policier attentif, un artiste créatif, un fermier travailleur et bien d'autres métiers fascinants. Chaque page offre une nouvelle expérience et permet à votre enfant d'en apprendre davantage sur la diversité des professions et leur importance.\n\nCe livre favorise non seulement l'apprentissage, mais encourage aussi l'imagination et aide votre enfant à explorer ses propres centres d'intérêt et aspirations. À travers cette aventure, votre enfant comprendra que chaque métier contribue à rendre notre monde meilleur et qu'avec de la détermination, tous les rêves sont possibles.",
        features: [
            "Pour enfants de 4 à 6 ans",
            "Contenu éducatif sur les métiers et leur rôle dans la société",
            "Illustrations personnalisées avec le visage de votre enfant",
            "Récit adapté pour stimuler la curiosité et l'imagination"
        ],
        previewPages: [
            {
                image: '/images/books/salif-metiers/page1.png',
                text: "Il était une fois {childName}, un{gender} petit{gender} {garçon/fille} de {childAge} ans plein{gender} de curiosité et d'imagination. Chaque jour, {childName} rêvait de devenir quelqu'un de différent quand {il/elle} serait grand{gender}."
            },
            {
                image: '/images/books/salif-metiers/page2.png',
                text: "Un matin, {childName} décida de s'imaginer pompier, prêt{gender} à sauver tout le monde. Avec sa lance à eau, {childName} était si brave ! « Je protège les gens des incendies », dit {childName} fièrement."
            },
            {
                image: '/images/books/salif-metiers/page3.png',
                text: "Le jour suivant, {childName} enfila un uniforme de police. « Je veille sur tout le monde dans ma ville, » dit {childName} en surveillant attentivement son quartier. {Il/Elle} aidait même les personnes à traverser la rue."
            },
            {
                image: '/images/books/salif-metiers/page4.png',
                text: "Le mercredi, {childName} prit ses crayons et devint un{gender} artiste talentueux{gender}. {childName} dessina des images magnifiques que tout le monde admira. « L'art nous permet d'exprimer nos émotions », expliqua {childName}."
            },
            {
                image: '/images/books/salif-metiers/page5.png',
                text: "Jeudi, {childName} s'occupa des animaux à la ferme. {childName} donna une carotte à la girafe et du grain aux poules. « Les fermiers nous fournissent notre nourriture, c'est très important », dit {childName}."
            },
            {
                image: '/images/books/salif-metiers/page6.png',
                text: "Vendredi, {childName} regarda les étoiles et rêva de devenir astronaute pour explorer l'espace et découvrir de nouvelles planètes. « Un jour, j'irai voir les étoiles de plus près », murmura {childName}."
            },
            {
                image: '/images/books/salif-metiers/page7.png',
                text: "À la fin de la semaine, {childName} comprit qu'{il/elle} pouvait devenir tout ce qu'{il/elle} voulait avec du travail et de la persévérance. « Tous les métiers sont importants et rendent notre monde meilleur », dit {childName}. Les possibilités étaient infinies pour un{gender} enfant aussi spécial{gender} !"
            }
        ]
    },
    {
        id: "2",
        title: "Soso et les Étoiles Magiques",
        folder: "soso-etoiles",
        price: 15000,
        ageRange: "2-4 ans",
        pages: 20,
        genre: "Aventure & Astronomie",
        idealFor: "Garçon & Fille",
        description: "Une aventure nocturne magique où votre enfant découvre les merveilles du ciel étoilé africain et les constellations racontées à travers des légendes traditionnelles.",
        longDescription: "Dans \"Soso et les Étoiles Magiques\", votre enfant embarque pour un voyage enchanteur sous le magnifique ciel étoilé d'Afrique.\n\nAlors que la nuit tombe sur le village, votre enfant ne peut pas dormir, fasciné{e} par les milliers d'étoiles qui brillent comme des diamants. C'est alors qu'une étoile filante traverse le ciel et l'invite à un voyage extraordinaire pour découvrir les constellations et leurs histoires ancestrales.\n\nAu fil de cette aventure, votre enfant rencontrera un vieux sage qui lui racontera les légendes africaines liées aux étoiles et lui apprendra le lien spécial qui unit le ciel à la terre selon les traditions locales.\n\nCette histoire émerveillante enseigne à votre enfant l'importance des traditions orales, la beauté de l'astronomie et le respect de la nature et du cosmos.",
        features: [
            "Pour enfants de 2 à 4 ans",
            "Initiation à l'astronomie adaptée aux tout-petits",
            "Illustrations personnalisées avec le visage de votre enfant",
            "Introduction aux traditions africaines liées aux étoiles"
        ],
        previewPages: [
            {
                image: '/images/books/soso-etoiles/page1.png',
                text: "La nuit était tombée sur le village, et {childName}, {childAge} ans, n'arrivait pas à dormir. Par la fenêtre, le ciel étoilé l'appelait à l'aventure."
            },
            {
                image: '/images/books/soso-etoiles/page2.png',
                text: "Guidé{gender} par sa curiosité, {childName} sortit dans la cour pour admirer les milliers d'étoiles qui brillaient comme des diamants au-dessus du village."
            },
            {
                image: '/images/books/soso-etoiles/page3.png',
                text: "Soudain, une étoile filante traversa le ciel ! Elle s'arrêta juste devant {childName} et se mit à scintiller comme pour lui parler."
            },
            {
                image: '/images/books/soso-etoiles/page4.png',
                text: "« Suis-moi, {childName} ! », murmura l'étoile dans un doux scintillement. « Je vais te montrer les secrets du ciel nocturne. »"
            },
            {
                image: '/images/books/soso-etoiles/page5.png',
                text: "L'étoile emmena {childName} voir la Grande Ourse. « C'est une grande casserole dans le ciel », expliqua l'étoile. « Elle nous aide à trouver notre chemin dans la nuit. »"
            },
            {
                image: '/images/books/soso-etoiles/page6.png',
                text: "Puis, ils rencontrèrent un vieux sage qui connaissait toutes les histoires du ciel. « Les étoiles sont les yeux de nos ancêtres qui veillent sur nous », dit-il à {childName}."
            },
            {
                image: '/images/books/soso-etoiles/page7.png',
                text: "« Et regarde cette constellation », continua le sage en pointant trois étoiles alignées. « C'est la ceinture du chasseur Orion, qui protège notre village. »"
            },
            {
                image: '/images/books/soso-etoiles/page8.png',
                text: "Avant de rentrer, l'étoile dit à {childName} : « N'oublie jamais, les étoiles sont toujours là, même quand tu ne les vois pas. Elles t'inspirent à rêver grand. »"
            },
            {
                image: '/images/books/soso-etoiles/page9.png',
                text: "De retour dans son lit, {childName} s'endormit paisiblement, avec plein de rêves étoilés dans la tête et la certitude que le ciel veillait sur {lui/elle}."
            }
        ]
    },
    {
        id: "3",
        title: "Le Voyage ABC avec Lina",
        folder: "lina-abc",
        price: 15000,
        ageRange: "2-4 ans",
        pages: 28,
        genre: "Éducation & Aventure",
        idealFor: "Garçon & Fille",
        description: "Une aventure éducative pour apprendre l'alphabet à travers l'Afrique. Votre enfant découvre une lettre à chaque étape de son voyage, enrichissant son vocabulaire tout en explorant la richesse culturelle africaine.",
        longDescription: "Dans \"Le Voyage ABC avec Lina\", votre enfant part pour une aventure alphabétique à travers les merveilles du continent africain.\n\nTout commence lorsque votre enfant reçoit un mystérieux livre sans texte, uniquement rempli d'images de lieux magnifiques d'Afrique. En touchant la première page, une magie incroyable se produit ! Votre enfant est transporté dans un safari alphabétique extraordinaire.\n\nDe A à Z, chaque lettre devient une découverte. A pour l'Antilope élégante qui court dans la savane, B pour le Baobab majestueux qui abrite de nombreux animaux, C pour les Contes que racontent les griots au village...\n\nCe livre éducatif enseigne non seulement les lettres de l'alphabet, mais également la richesse de la culture africaine, sa faune, sa flore et ses traditions. Une façon ludique d'apprendre tout en développant l'amour de la lecture et la fierté de son héritage culturel.",
        features: [
            "Pour enfants de 2 à 4 ans",
            "Apprentissage de l'alphabet avec des éléments africains",
            "Illustrations personnalisées avec le visage de votre enfant",
            "Enrichissement du vocabulaire et découverte de la culture africaine"
        ],
        previewPages: [
            {
                image: '/images/books/lina-abc/page1.png',
                text: "{childName}, {childAge} ans, reçut un jour un mystérieux livre sans texte. À l'intérieur, seulement des images de lieux merveilleux d'Afrique qui attendaient d'être découverts."
            },
            {
                image: '/images/books/lina-abc/page2.png',
                text: "Quand {childName} toucha la première page, une magie incroyable se produisit ! {childName} fut transporté{gender} dans un safari alphabétique à travers l'Afrique."
            },
            {
                image: '/images/books/lina-abc/page3.png',
                text: "A comme Antilope ! {childName} rencontra une antilope élégante qui bondissait gracieusement dans la savane dorée sous le soleil africain."
            },
            {
                image: '/images/books/lina-abc/page4.png',
                text: "B comme Baobab ! {childName} découvrit cet arbre immense et majestueux, que l'on appelle « l'arbre à l'envers » car ses branches ressemblent à des racines."
            },
            {
                image: '/images/books/lina-abc/page5.png',
                text: "C comme Conte ! Un vieux griot raconta à {childName} les histoires des ancêtres, transmises de génération en génération pour partager la sagesse."
            },
            {
                image: '/images/books/lina-abc/page6.png',
                text: "D comme Danse ! {childName} dansa au rythme des djembés lors d'une fête au village, où tout le monde célébrait ensemble dans la joie."
            },
            {
                image: '/images/books/lina-abc/page7.png',
                text: "Ainsi continua le voyage de {childName} à travers l'alphabet et les merveilles d'Afrique, découvrant une nouvelle lettre à chaque aventure."
            },
            {
                image: '/images/books/lina-abc/page8.png',
                text: "À la fin de son voyage, {childName} avait appris tout l'alphabet et connaissait beaucoup de choses sur l'Afrique, ses animaux, ses plantes et ses traditions."
            },
            {
                image: '/images/books/lina-abc/page9.png',
                text: "De retour à la maison, {childName} était impatient{gender} de partager toutes ses découvertes. Les livres, se dit {childName}, sont vraiment des portes magiques vers l'aventure et le savoir !"
            }
        ]
    }
];

// Helper pour filtrer les livres localement
export function filterBooks(books, filters) {
    let filteredBooks = books;

    if (filters.age) {
        filteredBooks = filteredBooks.filter(book => {
            if (!book.ageRange) return true;
            const [minAge, maxAge] = book.ageRange.split('-')[0].trim().split(' ')[0].split('-');
            const [filterMinAge, filterMaxAge] = filters.age.split('-');
            return (
                (parseInt(filterMinAge) >= parseInt(minAge) && parseInt(filterMinAge) <= parseInt(maxAge)) ||
                (parseInt(filterMaxAge) >= parseInt(minAge) && parseInt(filterMaxAge) <= parseInt(maxAge))
            );
        });
    }

    if (filters.genre) {
        filteredBooks = filteredBooks.filter(book =>
            book.genre && book.genre.toLowerCase().includes(filters.genre.toLowerCase())
        );
    }

    // Tri optionnel
    if (filters.sort === 'price-asc') {
        filteredBooks.sort((a, b) => a.price - b.price);
    } else if (filters.sort === 'price-desc') {
        filteredBooks.sort((a, b) => b.price - a.price);
    }

    return filteredBooks;
}

// Fonction générique pour récupérer les livres (Client ou Serveur)
export async function fetchBooksGeneric(supabaseClient, filters = {}) {
    try {
        // 1. Tenter de récupérer depuis Supabase
        const { data: dbBooks, error } = await supabaseClient
            .from('story_templates')
            .select('*')
            .eq('is_active', true);

        if (error) throw error;

        let allBooks = [];

        if (dbBooks && dbBooks.length > 0) {
            // Mapper les données DB vers le format local
            allBooks = dbBooks.map(b => ({
                id: b.id,
                title: b.title_template || "Titre Inconnu", // Fallback
                folder: b.theme_slug, // Assumer que theme_slug correspond au dossier d'images
                price: b.price || 3000, // Prix par défaut si manquant
                ageRange: b.age_range || "3-7 ans",
                genre: b.genre || "Aventure",
                description: b.description,
                longDescription: b.description, // Ou champ dédié
                features: ["Personnalisable", "Héros Africain", "Éducatif"], // Valeurs par défaut
                previewPages: [], // À gérer plus tard ou via un champ JSON
                coverUrl: b.cover_url || STATIC_COVERS[b.theme_slug] || '/images/covers/cover_school.jpg',
                tagline: b.tagline,
                ...b.content_json // Merge extra data if stored in JSON
            }));
        } else {
            // Fallback: Utiliser les données mockées si DB vide (pour éviter une UI vide)
            console.log("Database empty, using mock data");
            allBooks = [...booksData];
        }

        return filterBooks(allBooks, filters);

    } catch (err) {
        console.error("Error fetching books:", err);
        return filterBooks([...booksData], filters); // Fallback absolu
    }
}
