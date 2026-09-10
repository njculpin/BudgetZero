import { signInWithPassword } from '@gameloopers/core/auth';
import {
  checkRateLimit,
  rateLimitIdentity,
  rateLimitedResponse,
  RATE_LIMITS,
} from '@gameloopers/core/rate-limit';
import type { Controller } from '../../context';
import { json, redirect, serverError } from '../../responses';
import { setSessionCookies } from '../../gateway';

/**
 * Map the provider's error text to something a person can act on.
 *
 * Left as message matching because that is what the provider gives us; the
 * fallback is deliberately vague so a new error string never leaks provider
 * internals to the sign-in form.
 */
function friendlyError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'The email or password you entered is incorrect. Please try again.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Please verify your email address before signing in.';
  }
  if (message.includes('User not found')) {
    return 'No account found with this email address.';
  }
  return 'Unable to sign in. Please check your credentials and try again.';
}

export const authSignIn: Controller = async ({ request, clientAddress, cookies }) => {
  // Sign-in is the credential-stuffing target, so it is limited by client address
  // rather than by user: the whole point is that the attacker has no account yet.
  const rateLimit = await checkRateLimit(
    RATE_LIMITS.signIn,
    rateLimitIdentity(request, clientAddress ?? undefined)
  );

  if (!rateLimit.allowed) {
    return rateLimitedResponse(rateLimit);
  }

  const formData = await request.formData();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return new Response('Email and password are required', { status: 400 });
  }

  const { data, error } = await signInWithPassword({ email, password });

  if (error) {
    console.error('Sign-in error:', error.message, error);
    return json({ error: friendlyError(error.message) }, 401);
  }

  if (!data.session) {
    console.error('No session returned from sign-in');
    return serverError(
      'Unable to create session. Please try again or contact support if the ' +
        'problem persists.'
    );
  }

  // One definition of how a session cookie is written, shared with sign-up, the
  // OAuth callback and the gateway's own refresh. These three routes previously
  // disagreed: sign-up set httpOnly and secure, sign-in and callback did not.
  setSessionCookies(cookies, {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });

  return redirect('/products', 303);
};
