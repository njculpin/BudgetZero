import { createClient } from "@supabase/supabase-js";

/**
 * Service role client for server-side operations that bypass RLS.
 * Use with caution - only for operations where you've already verified user permissions.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
