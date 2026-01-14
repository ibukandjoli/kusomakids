import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/resend';
import { WelcomeEmail } from '@/lib/emails/WelcomeEmail';
import { SENDERS } from '@/lib/senders';

export async function POST(req) {
    try {
        const { email, name } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        const emailHtml = WelcomeEmail({ userName: name });

        const result = await sendEmail({
            to: email,
            from: SENDERS.WELCOME,
            subject: "🎉 Bienvenue dans la famille KusomaKids ! (Un petit mot du papa de Soraya)",
            html: emailHtml
        });

        if (result.success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

    } catch (error) {
        console.error("Welcome Email Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
