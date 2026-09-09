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
     * Populated by src/middleware.ts on authenticated requests. Typed loosely on
     * purpose: these are Supabase's own User/Session shapes, and pinning them here
     * would couple the app's ambient types to the SDK we deliberately isolate.
     */
    user?: Record<string, unknown> & { id: string };
    session?: Record<string, unknown> & { access_token: string };
  }
}
