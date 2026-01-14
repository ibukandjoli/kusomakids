import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
    try {
        // Ajout de childDescription pour la flexibilité (Métis, Caucasien, etc.)
        const { childName, childAge, gender, theme, childDescription } = await request.json();

        if (!childName || !theme) {
            return NextResponse.json(
                { error: "Le prénom et le thème sont requis" },
                { status: 400 }
            );
        }

        console.log(`🔍 Generating story for ${childName} on theme: ${theme}`);

        // 1. TENTATIVE : Récupérer depuis Supabase (Mode Économique ⚡️)
        const { data: template, error: dbError } = await supabase
            .from('story_templates')
            .select('content_json')
            .eq('theme_slug', theme)
            .single();

        // Check if template exists AND has valid content (pages array)
        if (template && template.content_json && template.content_json.pages && Array.isArray(template.content_json.pages) && template.content_json.pages.length > 0) {
            console.log("✅ Template found in DB! Using cached content.");

            let storyString = JSON.stringify(template.content_json);

            // Remplacements globaux
            storyString = storyString
                .replace(/{childName}/g, childName)
                .replace(/{childAge}/g, childAge)
                // Gestion du genre pour l'anglais (pour les prompts image)
                .replace(/{gender_en}/g, gender === 'Fille' ? 'girl' : 'boy')
                // Gestion du genre pour le texte (si le template le prévoit)
                .replace(/{gender}/g, gender);

            const story = JSON.parse(storyString);
            return NextResponse.json({ story, source: 'template' });
        }

        if (dbError && dbError.code !== 'PGRST116') {
            console.warn("⚠️ Supabase error:", dbError.message);
        }

        console.log("🤖 Template not found. Falling back to OpenAI Generation...");

        // 2. FALLBACK : Génération OpenAI (Mode Coûteux 💸)

        // --- CONFIGURATION DYNAMIQUE DU PROFIL ---
        const genderEn = gender === 'Fille' ? 'girl' : 'boy';

        // LOGIQUE INTELLIGENTE :
        // Si une description est fournie (ex: "Métis, cheveux bouclés"), on l'utilise.
        // Sinon, on applique le "Brand DNA" (Afro-descendant) mais de manière inclusive (pas de "dark skin" forcé).
        const physicalTraits = childDescription || `African heritage ${genderEn}, expressive eyes, distinct cultural features`;

        const systemPrompt = `Tu es un auteur et directeur artistique expert chez Pixar.
Ta mission est de créer une histoire pour enfant magique et engageante.

CONTEXTE VISUEL (IMPORTANT POUR L'IA IMAGE) :
Le style visuel est : "Modern 3D Pixar Animation style".
Le protagoniste est : ${childName}, ${childAge} years old, ${physicalTraits}.

REGLES DE REDACTION (TEXTE) :
1. Langue de l'histoire : FRANÇAIS.
2. Structure : Exactement 10 pages.
3. Contenu : "Il était une fois..." au début. 3-4 phrases simples par page.

REGLES CRITIQUES POUR LES PROMPTS D'IMAGES (imagePrompt) :
1. LANGUE : ANGLAIS (Impératif).
2. CONTENU : Ne décris PAS l'action ("il se souvient"), décris la SCÈNE VISUELLE ("il regarde une photo").
3. FORMAT : Commence TOUJOURS par : "A medium shot 3D Pixar style illustration of..."
4. PERSONNAGE : Inclure systématiquement : "${physicalTraits}, ${genderEn} named ${childName}".
5. AMBIANCE : Ajoute toujours : "warm cinematic lighting, magical atmosphere, vibrant colors, 8k".
6. INTERDIT : Ne JAMAIS utiliser les mots : "bokeh", "blur", "depth of field", "macro". On veut des arrière-plans détaillés.

Thème : "${theme}"
Héros : ${childName}, ${childAge} ans, ${gender}.

Format JSON strict attendu :
{
  "title": "Titre de l'histoire",
  "synopsis": "Court résumé",
  "pages": [
    { 
      "pageNumber": 1, 
      "text": "Texte de la page en Français...", 
      "imagePrompt": "A medium shot 3D Pixar style illustration of..." 
    }
  ]
}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Génère l'histoire sur le thème : ${theme}` }
            ],
            response_format: { type: "json_object" },
        });

        const story = JSON.parse(completion.choices[0].message.content);

        // 3. HYBRID MERGE STRATEGY (Optimization Coût Fal.ai 📉)
        // Même si le texte vient d'OpenAI, on vérifie si on a des "Base Images" dans la DB pour ce thème.
        // Si oui, on les injecte pour éviter de payer la génération Flux.

        if (template && template.content_json && template.content_json.pages) {
            console.log("🧩 Checking for Base Images to merge...");
            const dbPages = template.content_json.pages;

            if (Array.isArray(story.pages)) {
                story.pages = story.pages.map(aiPage => {
                    // Find matching page in DB template by pageNumber
                    const dbPage = dbPages.find(p => p.pageNumber === aiPage.pageNumber);
                    if (dbPage && dbPage.base_image_url) {
                        console.log(`⚡️ Merging Base Image for Page ${aiPage.pageNumber}`);
                        return {
                            ...aiPage,
                            base_image_url: dbPage.base_image_url // Inject URL for Frontend Caching
                        };
                    }
                    return aiPage;
                });
            }
        }

        return NextResponse.json({ story, source: 'openai' });

    } catch (error) {
        console.error("Erreur génération histoire:", error);
        return NextResponse.json(
            { error: "Erreur lors de la génération de l'histoire" },
            { status: 500 }
        );
    }
}