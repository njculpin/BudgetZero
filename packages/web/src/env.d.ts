/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string
  readonly PUBLIC_SUPABASE_ANON_KEY: string
  /** Server-side only. Bypasses RLS — never expose to the client. */
  readonly SUPABASE_SERVICE_ROLE_KEY: string
  /** Public origin of the deployed site, used to build links in outbound email. */
  readonly PUBLIC_SITE_URL: string
  readonly STRIPE_SECRET_KEY: string
  readonly PUBLIC_STRIPE_PUBLISHABLE_KEY: string
  readonly STRIPE_WEBHOOK_SECRET: string
  readonly STRIPE_CONNECT_WEBHOOK_SECRET: string
  readonly RESEND_API_KEY: string
  /**
   * Error monitoring. When unset, reports fall through to structured console
   * output and no monitoring SDK is loaded.
   */
  readonly PUBLIC_SENTRY_DSN?: string
  /**
   * Set to 'true' to run payments against a mock instead of Stripe. Bypasses webhook
   * signature verification, so it is rejected in production builds.
   */
  readonly MOCK_STRIPE?: string
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace App {
  interface Locals {
    /**
     * Populated by src/middleware.ts on authenticated requests, from the claims
     * of the caller's verified token. It is no longer the auth SDK's User shape:
     * the middleware verifies the token locally rather than exchanging it, so
     * only the claims the token actually carries are available here.
     */
    user?: { id: string; email?: string };
  }
}
