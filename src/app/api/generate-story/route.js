import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
    try {
        const { childName, childAge, gender, theme, childDescription } = await request.json();

        if (!childName || !theme) {
            return NextResponse.json({ error: "Le prénom et le thème sont requis" }, { status: 400 });
        }

        console.log(`🔍 PIVOT V1: Generating story for ${childName} on theme: ${theme}`);

        // 1. FETCH STATIC TEMPLATE (Visual Anchor)
        const { data: template, error: dbError } = await supabase
            .from('story_templates')
            .select('content_json')
            .eq('theme_slug', theme)
            .single();

        if (dbError || !template || !template.content_json?.pages) {
            console.warn("⚠️ Template not found for pivot strategy. theme:", theme);
            return NextResponse.json({ error: "Template introuvable pour ce thème." }, { status: 404 });
        }

        console.log("✅ Template loaded. Preparing Narrative Bridge...");
        const templatePages = template.content_json.pages;

        // 2. CONSTRUCT SCENE CONTEXT FOR AI
        // We tell OpenAI: "Here are the 10 images. Write the text for them."
        const scenesDescription = templatePages.map(p =>
            `Page ${p.pageNumber}: ${p.scene_context || "Scène générique"}`
        ).join('\n');

        const genderEn = gender === 'Fille' ? 'girl' : 'boy';
        const physicalTraits = childDescription || `African heritage ${genderEn}, ${childAge} years old`;

        const systemPrompt = `Tu es un auteur de livres pour enfants renommé.
Ta mission est d'écrire l'histoire textuelle qui accompagne une série d'illustrations fixes pré-existantes.

HÉROS : ${childName}, ${childAge} ans, ${gender}.
TON : Magique, doux, engageant, inspirant (style Disney/Pixar).
LANGUE : FRANÇAIS.

INSTRUCTIONS :
1. Je vais te donner la description visuelle de chaque page (SCENE_CONTEXT).
2. Pour chaque page, tu dois écrire un texte simple (2-3 phrases) qui décrit l'action DANS ce contexte visuel.
3. Le texte DOIT être cohérent avec l'image décrite. Ne fais pas faire au personnage des actions impossibles vu la description de la scène.
4. Intègre le nom ${childName} naturellement.

SCENE_CONTEXTS :
${scenesDescription}

FORMAT DE SORTIE JSON ATTENDU :
{
  "title": "Titre de l'histoire",
  "synopsis": "Court résumé",
  "pages": [
    { 
      "pageNumber": 1, 
      "text": "Texte correspondant à la scène 1..."
    },
    ... (jusqu'à la dernière page)
  ]
}`;

        // 3. GENERATE TEXT (Narrative Bridge)
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Écris l'histoire pour ${childName} sur le thème "${theme}" en suivant les scènes.` }
            ],
            response_format: { type: "json_object" },
        });

        const generatedStory = JSON.parse(completion.choices[0].message.content);

        // 4. MERGE (Text + Static Images)
        // We combine the AI Text with the Database Images
        const finalPages = templatePages.map((tmplPage, index) => {
            // Find corresponding text from AI (or fallback to index match)
            const aiPage = generatedStory.pages.find(p => p.pageNumber === tmplPage.pageNumber) || generatedStory.pages[index];

            return {
                pageNumber: tmplPage.pageNumber,
                text: aiPage ? aiPage.text : tmplPage.text, // Fallback to template text if AI fails
                imagePrompt: tmplPage.scene_context, // Keep context as prompt metadata
                base_image_url: tmplPage.base_image_url, // THE KEY: Static Image URL
                audio_url: null
            };
        });

        const finalStory = {
            title: generatedStory.title || "L'Aventure Magique",
            synopsis: generatedStory.synopsis,
            pages: finalPages
        };

        console.log("✅ Story merged successfully. Ready for Face Swap Worker.");
        return NextResponse.json({ story: finalStory, source: 'pivot_v1' });

    } catch (error) {
        console.error("🚨 Error in generate-story:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}