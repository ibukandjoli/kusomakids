import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Fallback Templates (4 pages) - Used only if DB fails AND OpenAI fails, or as a reference structure
const FALLBACK_TEMPLATES = {
    // ... (Keep existing simple templates if needed, or just rely on OpenAI)
    // We will rely on OpenAI as the fallback if DB template is missing.
};

export async function POST(request) {
    try {
        const { childName, childAge, gender, theme } = await request.json();

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

        if (template && template.content_json) {
            console.log("✅ Template found in DB! Using cached content.");

            // Injection des variables dans le JSON du template
            let storyString = JSON.stringify(template.content_json);

            // Remplacements globaux
            storyString = storyString
                .replace(/{childName}/g, childName)
                .replace(/{childAge}/g, childAge)
                // Gestion basique du genre pour l'anglais (pour les prompts image)
                .replace(/{gender_en}/g, gender === 'Fille' ? 'girl' : 'boy')
                // Gestion du genre pour le texte (si le template le prévoit) - À améliorer
                .replace(/{gender}/g, gender);

            const story = JSON.parse(storyString);
            return NextResponse.json({ story, source: 'template' });
        }

        if (dbError && dbError.code !== 'PGRST116') { // Ignorer erreur "Not found"
            console.warn("⚠️ Supabase error:", dbError.message);
        }

        console.log("🤖 Template not found. Falling back to OpenAI Generation...");

        // 2. FALLBACK : Génération OpenAI (Mode Coûteux 💸)
        // Note: OpenAI génère par défaut 4 pages car c'est plus stable pour l'instant.
        // Les templates DB sont à 10 pages.
        const systemPrompt = `Tu es un auteur de livres pour enfants expert.
Ta mission est de suivre STRICTEMENT la consigne suivante pour créer l'histoire.

REGLES :
1. L'histoire doit IMPÉRATIVEMENT commencer par : "Il était une fois...".
2. L'histoire doit faire exactement 4 pages.
3. Chaque page : 2-3 phrases simples et engageantes.
4. Pour chaque page : un "imagePrompt" détaillé (Pixar style, cute, ${gender === 'Fille' ? 'girl' : 'boy'}, ${childAge} years old).
5. Format JSON strict.

Thème : "${theme}"
Héros : ${childName}, ${childAge} ans, ${gender}.

Structure JSON :
{
  "title": "Titre Histoire",
  "synopsis": "Résumé",
  "pages": [ { "pageNumber": 1, "text": "...", "imagePrompt": "..." } ]
}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Génère l'histoire.` }
            ],
            response_format: { type: "json_object" },
        });

        const story = JSON.parse(completion.choices[0].message.content);

        return NextResponse.json({ story, source: 'openai' });

    } catch (error) {
        console.error("Erreur génération histoire:", error);
        return NextResponse.json(
            { error: "Erreur lors de la génération de l'histoire" },
            { status: 500 }
        );
    }
}
