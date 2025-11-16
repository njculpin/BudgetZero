import { resend } from "./client";

/**
 * Email abstraction layer - isolates Resend SDK from application code
 *
 * IMPORTANT: Never import Resend SDK directly outside this directory.
 * Always use these exported functions to maintain SDK isolation.
 */

export interface SendEmailParams {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using the configured email service
 */
export const sendEmail = async (params: SendEmailParams): Promise<SendEmailResult> => {
  if (!resend) {
    console.warn('Email service not configured. Skipping email send.');
    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  try {
    const result = await resend.emails.send({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (result.error) {
      console.error('Error sending email:', result.error);
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Check if email service is configured
 */
export const isEmailConfigured = (): boolean => {
  return resend !== null;
};
