import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('RESEND_API_KEY is missing. Emails will not be sent.');
}

export const resend = new Resend(resendApiKey || 're_123'); // Fallback to prevent crash on build, but won't send
