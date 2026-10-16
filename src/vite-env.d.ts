/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL; with the key below, enables shared history. Public values. */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase publishable key (sb_publishable_…), safe to ship in the browser. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  /** "true" once the Google provider is configured in Supabase: shows "Continuer avec Google". */
  readonly VITE_SUPABASE_GOOGLE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
