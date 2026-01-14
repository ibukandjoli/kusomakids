import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html }) => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('⚠️ RESEND_API_KEY is missing. Email not sent.');
        return { success: false, error: 'Missing API Key' };
    }

    try {
        const data = await resend.emails.send({
            from: 'KusomaKids <onboarding@resend.dev>', // Update to 'hello@kusomakids.com' once domain is verified
            to: typeof to === 'string' ? [to] : to,
            subject: subject,
            html: html,
        });

        console.log(`📧 Email sent to ${to}: ${subject}`, data);
        return { success: true, data };
    } catch (error) {
        console.error('❌ Email Failed:', error);
        return { success: false, error };
    }
};
