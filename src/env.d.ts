interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string
  readonly PUBLIC_SUPABASE_ANON_KEY: string
  readonly STRIPE_SECRET_KEY: string
  readonly PUBLIC_STRIPE_PUBLISHABLE_KEY: string
  readonly STRIPE_WEBHOOK_SECRET: string
  readonly RESEND_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}