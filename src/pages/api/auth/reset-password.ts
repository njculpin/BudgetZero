import type { APIRoute } from 'astro';
import { authClient } from '@/lib/auth/client';
import { sendEmail } from '@/lib/email';

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString();

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const origin = new URL(request.url).origin;
    const redirectTo = `${origin}/reset-password`;

    const { error } = await authClient.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error('Password reset error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send custom password reset email
    await sendEmail({
      from: 'Game Loopers <noreply@gameloopers.com>',
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Reset Your Password</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            We received a request to reset your password. Click the button below to create a new password:
          </p>

          <p style="margin: 30px 0;">
            <a href="${redirectTo}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Reset Password
            </a>
          </p>

          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            If you didn't request this, you can safely ignore this email. Your password will not be changed.
          </p>

          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            This link will expire in 1 hour for security reasons.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 14px;">
            Game Loopers - A social commerce platform for tabletop game creators
          </p>
        </div>
      `,
      text: `Reset Your Password\n\nWe received a request to reset your password.\n\nReset your password here: ${redirectTo}\n\nIf you didn't request this, you can safely ignore this email. Your password will not be changed.\n\nThis link will expire in 1 hour for security reasons.\n\nGame Loopers - A social commerce platform for tabletop game creators`,
    }).catch((error) => {
      console.error('Failed to send password reset email:', error);
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password reset email sent. Check your inbox.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to send reset email',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
