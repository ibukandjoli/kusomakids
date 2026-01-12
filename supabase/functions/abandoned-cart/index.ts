import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import { Resend } from "https://esm.sh/resend@1.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))
const supabaseUrl = Deno.env.get("SUPABASE_URL")
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

serve(async (req) => {
    try {
        // 1. Calculate time threshold (2 hours ago)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

        // 2. Query for abandoned carts
        // Logic: Created > 2h ago AND NOT unlocked AND NO notification sent yet
        const { data: abandonedBooks, error } = await supabase
            .from('generated_books')
            .select('*, profiles(email, full_name)')
            .lt('created_at', twoHoursAgo)
            .eq('is_unlocked', false)
            .is('abandoned_cart_sent_at', null) // Ensure we haven't sent it yet
            .limit(50); // Process in batches

        if (error) throw error;

        console.log(`Found ${abandonedBooks.length} abandoned books.`);

        // 3. Loop and Send Emails
        const results = await Promise.all(abandonedBooks.map(async (book) => {
            const email = book.profiles?.email;
            const name = book.profiles?.full_name || "Parent";
            const childName = book.child_name || "votre enfant";

            if (!email) return { id: book.id, status: 'skipped_no_email' };

            // Send Email
            const { data: emailData, error: emailError } = await resend.emails.send({
                from: 'Kusoma Kids <coucou@kusomakids.com>',
                to: [email],
                subject: `L'histoire de ${childName} est prête ! 📖`,
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Bonjour ${name},</h1>
            <p>L'histoire <strong>"${book.title}"</strong> est générée et n'attend plus que sa lecture du soir.</p>
            <p>Ne laissez pas ce souvenir s'effacer. Cliquez ci-dessous pour le débloquer et voir les étoiles dans les yeux de ${childName}.</p>
            <br/>
            <a href="https://kusomakids.com/read/${book.id}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Récupérer mon histoire
            </a>
            <br/><br/>
            <p>À très vite,<br/>L'équipe Kusoma Kids 🦁</p>
          </div>
        `
            });

            if (emailError) {
                console.error(`Failed to send to ${email}`, emailError);
                return { id: book.id, status: 'failed' };
            }

            // Mark as sent
            await supabase
                .from('generated_books')
                .update({ abandoned_cart_sent_at: new Date().toISOString() })
                .eq('id', book.id);

            return { id: book.id, status: 'sent' };
        }));

        return new Response(
            JSON.stringify(results),
            { headers: { "Content-Type": "application/json" } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        )
    }
})
