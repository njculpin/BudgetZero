import { exchangeCodeForSession } from '@gameloopers/core/auth';
import type { Controller } from '../../context';
import { redirect } from '../../responses';
import { setSessionCookies } from '../../gateway';

export const authCallback: Controller = async ({ url, cookies }) => {
  const authCode = url.searchParams.get('code');

  if (!authCode) {
    return new Response('No code provided', { status: 400 });
  }

  const { data, error } = await exchangeCodeForSession(authCode);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  // This route previously wrote the session cookies with httpOnly and secure
  // both false, so an account created through OAuth had a weaker session than
  // one created through the sign-up form. They now go through one definition.
  setSessionCookies(cookies, {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });

  return redirect('/products', 303);
};
