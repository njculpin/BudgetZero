import { Resend } from 'resend';

const resendApiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('RESEND_API_KEY environment variable is not set. Email functionality will be disabled.');
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null;
