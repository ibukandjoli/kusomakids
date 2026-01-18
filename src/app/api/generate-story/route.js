import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
    try {
        const { childName, childAge, gender, theme, childDescription, city } = await request.json();

        if (!childName || !theme) {
            return NextResponse.json({ error: "Le prénom et le thème sont requis" }, { status: 400 });
        }

        console.log(`🔍 PIVOT V1 - STATIC TEXT: Generating story for ${childName} on theme: ${theme}`);

        // 1. FETCH STATIC TEMPLATE
        const { data: template, error: dbError } = await supabase
            .from('story_templates')
            .select('*')
            .eq('theme_slug', theme)
            .single();

        if (dbError || !template || !template.content_json?.pages) {
            console.warn("⚠️ Template not found:", theme);
            return NextResponse.json({ error: "Template introuvable pour ce thème." }, { status: 404 });
        }

        const templatePages = template.content_json.pages;

        // 2. VARIABLE REPLACEMENT ENGINE
        // This replaces {childName}, {childAge} in the static text
        const replaceVariables = (text) => {
            if (!text) return "";
            let processed = text;
            processed = processed.replace(/{childName}/gi, childName);
            processed = processed.replace(/{childAge}/gi, childAge || "");
            processed = processed.replace(/{gender}/gi, gender || "");
            processed = processed.replace(/{city}/gi, city || "sa ville");
            return processed;
        };

        // 3. ASSEMBLE STORY
        const finalPages = templatePages.map((tmplPage) => {
            return {
                pageNumber: tmplPage.pageNumber,
                text: replaceVariables(tmplPage.text_template || "Texte manquant..."),
                imagePrompt: tmplPage.scene_context, // Kept for reference
                base_image_url: tmplPage.base_image_url,
                audio_url: null
            };
        });

        const finalStory = {
            title: template.title_template ? replaceVariables(template.title_template) : `L'Aventure de ${childName}`,
            synopsis: template.description || "Une aventure magique...",
            pages: finalPages
        };

        console.log("✅ Story assembled successfully (Static Text Mode).");
        return NextResponse.json({ story: finalStory, source: 'pivot_v1_static' });

    } catch (error) {
        console.error("🚨 Error in generate-story:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}