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
export const createAuthenticatedClient = async (accessToken: string, refreshToken: string): Promise<SupabaseClient> => {
  const client = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: "pkce",
      },
    },
  );

  // Set the session (must be awaited to ensure auth context is set)
  await client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return client;
};
