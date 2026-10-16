import { useState, type FormEvent } from 'react'
import type { AuthApi } from '../sync/cloud'
import { SYNC_LABELS } from '../sync/syncLabels'
import type { CloudSync } from '../sync/useCloudSync'

interface Props {
  auth: AuthApi
  sync: CloudSync
  onBack: () => void
}

export function AccountPanel({ auth, sync, onBack }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function run(action: () => Promise<string | null>) {
    setBusy(true)
    setMessage(null)
    try {
      const text = await action()
      if (text !== null) setMessage({ ok: true, text })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : String(err) })
    } finally {
      setBusy(false)
    }
  }

  function signIn(event: FormEvent) {
    event.preventDefault()
    void run(async () => {
      await auth.signIn(email.trim(), password)
      setPassword('')
      return null
    })
  }

  function signUp() {
    void run(async () => {
      const { needsConfirmation } = await auth.signUp(email.trim(), password)
      setPassword('')
      return needsConfirmation
        ? 'Compte créé. Clique sur le lien reçu par e-mail pour le confirmer, puis connecte-toi ici.'
        : 'Compte créé, tu es connecté.'
    })
  }

  return (
    <section className="account">
      <header className="page-header">
        <h2>Compte et synchronisation</h2>
        <button type="button" className="link" onClick={onBack}>
          ← Accueil
        </button>
      </header>

      {sync.user === null ? (
        <>
          <p className="muted">
            Connecte-toi avec le même compte sur chaque appareil (PC, téléphone) : ton historique, tes niveaux et tes
            points faibles sont partagés. Sans connexion, l’app fonctionne comme avant, sur cet appareil seulement.
          </p>
          <form className="account-form" onSubmit={signIn}>
            <label>
              E-mail
              <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              Mot de passe
              <input
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <div className="actions">
              <button type="submit" disabled={busy}>
                Se connecter
              </button>
              <button type="button" className="secondary" disabled={busy || email === '' || password.length < 8} onClick={signUp}>
                Créer un compte
              </button>
            </div>
          </form>
        </>
      ) : (
        <>
          <p>
            Connecté : <strong>{sync.user.email}</strong>
          </p>
          <p className={sync.status === 'error' ? 'ko' : 'muted'} role="status">
            {SYNC_LABELS[sync.status]}
            {sync.lastSyncAt !== null && sync.status === 'synced' && ` · ${sync.lastSyncAt.toLocaleTimeString('fr-FR')}`}
            {sync.error !== null && sync.status !== 'synced' && ` : ${sync.error}`}
          </p>
          <div className="actions">
            <button type="button" onClick={sync.syncNow} disabled={sync.status === 'syncing'}>
              Synchroniser maintenant
            </button>
            <button type="button" className="secondary" disabled={busy} onClick={() => void run(async () => (await auth.signOut(), null))}>
              Se déconnecter
            </button>
          </div>
          <p className="muted small">Les sessions déjà sur cet appareil restent disponibles après déconnexion.</p>
        </>
      )}

      {message !== null && (
        <p className={message.ok ? 'ok' : 'ko'} role={message.ok ? 'status' : 'alert'}>
          {message.text}
        </p>
      )}
    </section>
  )
}
