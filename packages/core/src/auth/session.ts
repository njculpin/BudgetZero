import { createClient } from '@supabase/supabase-js';
import { readEnv } from '../env';

/**
 * Session refresh, isolated from the shared auth client.
 *
 * `authClient` in ./client.ts is a module-level singleton, and
 * `authClient.auth.setSession()` stores the session *on it*. On a server that
 * makes it shared mutable state: two requests in flight in the same process can
 * observe each other's session. Per-invocation isolation on Vercel hides most of
 * this today, but it becomes live the moment the app runs as a long-lived Node
 * process — which is a deployment decision, not a code change, and not one that
 * should quietly introduce a cross-user session bug.
 *
 * A client built here, used once and discarded, has nowhere to leak. Constructing
 * one costs nothing: `createClient` makes no network call, and refresh only runs
 * when an access token has actually expired — roughly once an hour per session,
 * rather than on every request.
 */

export interface RefreshedSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * Exchange a refresh token for a new session.
 *
 * Returns `null` when the refresh token is exhausted, revoked or otherwise
 * rejected — the caller should treat that as signed out.
 */
export async function refreshSession(
  refreshToken: string
): Promise<RefreshedSession | null> {
  const url = readEnv('PUBLIC_SUPABASE_URL');
  const anonKey = readEnv('PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !anonKey || !refreshToken) return null;

  // Not the shared singleton: a fresh client, scoped to this call.
  const client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  try {
    const { data, error } = await client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session || !data.user) return null;

    return {
      userId: data.user.id,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  } catch {
    return null;
  }
}

/**
 * Change the signed-in user's password.
 *
 * This used to call `setSession()` on the shared `authClient` and then
 * `authClient.auth.updateUser()`, relying on the mutation in between. Two
 * concurrent password changes in one process could therefore act on each other's
 * session — the worst possible instance of that bug, since the operation being
 * confused is "set this account's password".
 *
 * The token is attached to a client built for this one call, so there is no
 * shared session to confuse.
 */
export async function updatePasswordForUser(
  accessToken: string,
  password: string
): Promise<{ error: string | null }> {
  const url = readEnv('PUBLIC_SUPABASE_URL');
  const anonKey = readEnv('PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !anonKey) return { error: 'Auth is not configured' };

  const client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  try {
    const { error } = await client.auth.updateUser({ password });
    return { error: error?.message ?? null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to update password',
    };
  }
}
