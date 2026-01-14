const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkChildren() {
    const { data, error } = await supabase.from('children').select('*').limit(1);
    if (error) {
        console.error("Children Error:", error);
        // Try profiles to see if it's nested
        const { data: profiles } = await supabase.from('profiles').select('*').limit(1);
        console.log("Profiles Sample:", profiles);
    } else {
        console.log("Children Columns:", data.length > 0 ? Object.keys(data[0]) : "Table empty or columns unknown");
        console.log("Children Sample:", data);
    }
}

checkChildren();
