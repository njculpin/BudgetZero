// src/lib/data-access/client.ts

import { createClient } from "@supabase/supabase-js";

// Public client for unauthenticated/client-side operations
// Uses anon key with RLS policies enforced
export const dataClient = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      flowType: "pkce",
    },
  },
);

// Server-side client with service role key (bypasses RLS)
// Use this for server-side operations in API routes and .astro pages
// IMPORTANT: Never expose this to the client - server-side only!
export const serverClient = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
