
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Manually load env local
try {
    const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (e) {
    console.log("No .env.local found or error reading it");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing keys!", { supabaseUrl, hasKey: !!supabaseAnonKey });
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    console.log("Testing connection...");
    const { data, error } = await supabase
        .from('story_templates')
        .select('*')
        .eq('theme_slug', "L'École")
        .single();

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Success! Found template:", data ? data.theme_slug : "None");
    }
}

test();
