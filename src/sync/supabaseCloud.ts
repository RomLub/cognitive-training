import { createClient, type AuthError, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { SessionRecord } from '../core/types'
import { parseSessionRecord } from '../storage/sessionRepository'
import type { AuthApi, Cloud, CloudUser, RemoteSessionStore } from './cloud'

/** Table created by supabase/schema.sql. */
const TABLE = 'training_sessions'
/** Data API returns at most 1000 rows per request by default. */
const PAGE_SIZE = 1000

interface SessionRow {
  id: string
  started_at: string
  record: unknown
}

export function toRow(record: SessionRecord): Omit<SessionRow, 'record'> & { record: SessionRecord } {
  return { id: record.id, started_at: record.startedAt, record }
}

/** Validates a row from the server; a malformed row is an error, never silently dropped. */
export function fromRow(row: SessionRow): SessionRecord {
  const record = parseSessionRecord(row.record)
  if (record === null || record.id !== row.id) throw new Error(`Session invalide reçue du serveur (${row.id})`)
  return record
}

const AUTH_MESSAGES: Readonly<Record<string, string>> = {
  invalid_credentials: 'E-mail ou mot de passe incorrect.',
  email_not_confirmed: 'Confirme d’abord ton e-mail : clique sur le lien reçu, puis reconnecte-toi.',
  user_already_exists: 'Un compte existe déjà avec cet e-mail : connecte-toi.',
  email_exists: 'Un compte existe déjà avec cet e-mail : connecte-toi.',
  weak_password: 'Mot de passe trop faible (au moins 8 caractères conseillés).',
  over_email_send_rate_limit: 'Trop d’e-mails envoyés : réessaie dans une heure.',
  over_request_rate_limit: 'Trop de tentatives : réessaie dans quelques minutes.',
  validation_failed: 'E-mail invalide.',
}

function authError(error: AuthError): Error {
  console.error('Supabase auth error', error.code, error.message)
  return new Error(AUTH_MESSAGES[error.code ?? ''] ?? `Erreur de connexion : ${error.message}`)
}

function toCloudUser(user: User | null | undefined): CloudUser | null {
  return user == null ? null : { id: user.id, email: user.email ?? null }
}

/** Where the app lives (GitHub Pages sub-folder or localhost); must be in the auth redirect allow list. */
function appUrl(): string {
  return `${window.location.origin}${window.location.pathname}`
}

class SupabaseAuth implements AuthApi {
  private readonly client: SupabaseClient
  readonly googleEnabled: boolean

  constructor(client: SupabaseClient, googleEnabled: boolean) {
    this.client = client
    this.googleEnabled = googleEnabled
  }

  async signInWithGoogle(): Promise<void> {
    const { error } = await this.client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: appUrl() } })
    if (error !== null) throw authError(error)
  }

  async currentUser(): Promise<CloudUser | null> {
    const { data, error } = await this.client.auth.getSession()
    if (error !== null) throw authError(error)
    return toCloudUser(data.session?.user)
  }

  onChange(listener: (user: CloudUser | null) => void): () => void {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => listener(toCloudUser(session?.user)))
    return () => data.subscription.unsubscribe()
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.client.auth.signInWithPassword({ email, password })
    if (error !== null) throw authError(error)
  }

  async signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }> {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      // The confirmation link brings the user back to the app wherever it is hosted.
      options: { emailRedirectTo: appUrl() },
    })
    if (error !== null) throw authError(error)
    return { needsConfirmation: data.session === null }
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut()
    if (error !== null) throw authError(error)
  }
}

class SupabaseSessionStore implements RemoteSessionStore {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async fetchAll(): Promise<SessionRecord[]> {
    const records: SessionRecord[] = []
    for (let from = 0; ; from += PAGE_SIZE) {
      // RLS restricts rows to the signed-in user.
      const { data, error } = await this.client
        .from(TABLE)
        .select('id, started_at, record')
        .order('started_at', { ascending: true })
        .order('id', { ascending: true })
        .range(from, from + PAGE_SIZE - 1)
      if (error !== null) throw new Error(`Lecture du serveur impossible : ${error.message}`)
      const rows = data as SessionRow[]
      records.push(...rows.map(fromRow))
      if (rows.length < PAGE_SIZE) return records
    }
  }

  async upload(records: readonly SessionRecord[]): Promise<void> {
    if (records.length === 0) return
    // user_id defaults to auth.uid() server side; existing sessions are left untouched.
    const { error } = await this.client
      .from(TABLE)
      .upsert(records.map(toRow), { onConflict: 'user_id,id', ignoreDuplicates: true })
    if (error !== null) throw new Error(`Envoi au serveur impossible : ${error.message}`)
  }
}

export function createSupabaseCloud(url: string, publishableKey: string, options: { google: boolean }): Cloud {
  const client = createClient(url, publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  return { auth: new SupabaseAuth(client, options.google), remote: new SupabaseSessionStore(client) }
}

/** Cloud from build-time config, or null when not configured (the app then stays local-only). */
export function cloudFromEnv(): Cloud | null {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (url === undefined || url === '' || key === undefined || key === '') return null
  return createSupabaseCloud(url, key, { google: import.meta.env.VITE_SUPABASE_GOOGLE === 'true' })
}
