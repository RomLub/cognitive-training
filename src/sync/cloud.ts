import type { SessionRecord } from '../core/types'

/**
 * Cloud services the app needs for shared history. Kept as interfaces so the app and its tests
 * never depend on Supabase directly (see supabaseCloud.ts for the real implementation).
 */
export interface CloudUser {
  id: string
  email: string | null
}

export interface AuthApi {
  currentUser(): Promise<CloudUser | null>
  /** Calls the listener on sign-in / sign-out; returns an unsubscribe function. */
  onChange(listener: (user: CloudUser | null) => void): () => void
  /** Throws an Error with a user-facing (French) message on failure. */
  signIn(email: string, password: string): Promise<void>
  /** `needsConfirmation`: the account exists but the e-mail link must be clicked before signing in. */
  signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }>
  signOut(): Promise<void>
}

export interface RemoteSessionStore {
  /** Every session of the signed-in user. */
  fetchAll(): Promise<SessionRecord[]>
  /** Adds sessions; sessions already stored remotely are ignored (they never change). */
  upload(records: readonly SessionRecord[]): Promise<void>
}

export interface Cloud {
  auth: AuthApi
  remote: RemoteSessionStore
}
