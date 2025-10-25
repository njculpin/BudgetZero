import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Base client for unauthenticated operations
export const dataClient = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      flowType: "pkce",
    },
  },
);

/**
 * Create an authenticated Supabase client with session
 * Use this for operations that require authentication
 */
export const createAuthenticatedClient = (accessToken: string, refreshToken: string): SupabaseClient => {
  const client = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: "pkce",
      },
    },
  );

  // Set the session
  client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return client;
};
