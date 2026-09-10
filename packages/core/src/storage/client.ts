import { createClient } from "@supabase/supabase-js";

/**
 * Anon-key storage client.
 *
 * Carries no session, so `auth.uid()` is NULL for anything it does. Storage RLS
 * scopes writes to the owning user, which means this client cannot write. It is
 * only useful for reading public buckets (product-images, user-avatars).
 *
 * To upload as a user, pass `accessToken` to `uploadFile()` — that builds a
 * request-scoped client carrying the caller's JWT.
 */
export const storageClient = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      flowType: "pkce",
    },
  },
);

/**
 * Service-role storage client. Bypasses storage RLS — server-side only.
 *
 * Required for private buckets. `product-files` deliberately grants SELECT to no
 * one but the service role, so signing a download URL with the anon client above
 * fails: signing needs read permission on the object. The entitlement check that
 * justifies the signature happens in application code before we get here (see
 * /api/download), which is why bypassing RLS is correct rather than a shortcut.
 *
 * IMPORTANT: never expose this client, or anything it returns unscoped, to the
 * browser.
 */
export const storageAdminClient = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
