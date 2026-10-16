import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'
import type { SessionRecord } from './core/types'
import { SESSION_LENGTH } from './domains/calculation/session'
import type { SessionRepository } from './storage/sessionRepository'
import type { AuthApi, Cloud, CloudUser, RemoteSessionStore } from './sync/cloud'

class MemoryRepository implements SessionRepository {
  records: SessionRecord[] = []
  list() {
    return [...this.records]
  }
  add(record: SessionRecord) {
    this.records.push(record)
  }
  addMany(records: readonly SessionRecord[]) {
    for (const r of records) if (!this.records.some((x) => x.id === r.id)) this.records.push(r)
  }
}

class FakeAuth implements AuthApi {
  user: CloudUser | null = null
  listeners = new Set<(u: CloudUser | null) => void>()
  accounts = new Map<string, string>()
  async currentUser() {
    return this.user
  }
  onChange(listener: (u: CloudUser | null) => void) {
    this.listeners.add(listener)
    return () => void this.listeners.delete(listener)
  }
  private set(user: CloudUser | null) {
    this.user = user
    for (const l of this.listeners) l(user)
  }
  async signIn(email: string, password: string) {
    if (this.accounts.get(email) !== password) throw new Error('E-mail ou mot de passe incorrect.')
    this.set({ id: `u-${email}`, email })
  }
  async signUp(email: string, password: string) {
    this.accounts.set(email, password)
    return { needsConfirmation: true }
  }
  async signOut() {
    this.set(null)
  }
}

class FakeRemote implements RemoteSessionStore {
  records: SessionRecord[] = []
  failing = false
  async fetchAll() {
    if (this.failing) throw new Error('Lecture du serveur impossible : timeout')
    return [...this.records]
  }
  async upload(records: readonly SessionRecord[]) {
    for (const r of records) if (!this.records.some((x) => x.id === r.id)) this.records.push(r)
  }
}

function remoteSession(id: string, endLevel: number): SessionRecord {
  return {
    id, domain: 'calculation', exercise: 'arithmetic', startedAt: '2026-10-14T10:00:00.000Z',
    startLevel: 1, endLevel, items: 20, correct: 18, avgResponseMs: 3000,
  }
}

function solveDisplayedProblem(): number {
  const [, a, op, b] = /^(\d+) (\S) (\d+)$/.exec(document.querySelector('.problem')!.textContent!)!
  return { '+': +a! + +b!, '-': +a! - +b!, '×': +a! * +b!, '÷': +a! / +b! }[op as '+']
}

function setup() {
  const auth = new FakeAuth()
  const remote = new FakeRemote()
  const repo = new MemoryRepository()
  const cloud: Cloud = { auth, remote }
  render(<App repository={repo} cloud={cloud} />)
  return { auth, remote, repo }
}

async function signInVia(email: string, password: string) {
  fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }))
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: password } })
  fireEvent.submit(screen.getByLabelText('E-mail').closest('form')!)
}

describe('shared history', () => {
  afterEach(cleanup)

  it('stays local-only without cloud config', () => {
    render(<App repository={new MemoryRepository()} cloud={null} />)
    expect(screen.queryByRole('button', { name: /Se connecter/ })).toBeNull()
  })

  it('creates an account, explains the e-mail confirmation, then signs in', async () => {
    const { auth } = setup()
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }))
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'moi@example.com' } })
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'motdepasse1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Créer un compte' }))
    expect(await screen.findByText(/Clique sur le lien reçu par e-mail/)).toBeTruthy()
    expect(auth.accounts.get('moi@example.com')).toBe('motdepasse1')

    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'motdepasse1' } })
    fireEvent.submit(screen.getByLabelText('E-mail').closest('form')!)
    expect(await screen.findByText('moi@example.com')).toBeTruthy()
  })

  it('shows a sign-in error', async () => {
    setup()
    await signInVia('moi@example.com', 'mauvais-mdp')
    expect((await screen.findByRole('alert')).textContent).toContain('E-mail ou mot de passe incorrect.')
  })

  it('brings sessions made on another device and uploads local ones on sign-in', async () => {
    const { auth, remote, repo } = setup()
    repo.records.push(remoteSession('pc-local', 3))
    remote.records.push(remoteSession('from-phone', 7))
    auth.accounts.set('moi@example.com', 'motdepasse1')

    await signInVia('moi@example.com', 'motdepasse1')
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Synchronisé'))
    expect(repo.records.map((r) => r.id).sort()).toEqual(['from-phone', 'pc-local'])
    expect(remote.records.map((r) => r.id).sort()).toEqual(['from-phone', 'pc-local'])

    // The home screen reflects the merged history (latest session: level 7 from the phone).
    fireEvent.click(screen.getByRole('button', { name: /Accueil/ }))
    expect(within(screen.getByRole('article', { name: 'Opérations' })).getByText(/Niveau 7\/10 · 2 sessions/)).toBeTruthy()
  })

  it('uploads a session as soon as it is finished', async () => {
    const { auth, remote } = setup()
    auth.accounts.set('moi@example.com', 'motdepasse1')
    await signInVia('moi@example.com', 'motdepasse1')
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Synchronisé'))
    fireEvent.click(screen.getByRole('button', { name: /Accueil/ }))

    fireEvent.click(within(screen.getByRole('article', { name: 'Opérations' })).getByRole('button', { name: 'Commencer' }))
    const input = screen.getByLabelText('Réponse')
    for (let i = 0; i < SESSION_LENGTH; i++) {
      fireEvent.change(input, { target: { value: String(solveDisplayedProblem()) } })
      fireEvent.submit(input.closest('form')!)
    }
    await waitFor(() => expect(remote.records).toHaveLength(1))
    expect(remote.records[0]!.exercise).toBe('arithmetic')
  })

  it('reports a sync error and recovers on retry', async () => {
    const { auth, remote } = setup()
    remote.failing = true
    auth.accounts.set('moi@example.com', 'motdepasse1')
    await signInVia('moi@example.com', 'motdepasse1')
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('timeout'))

    remote.failing = false
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Synchroniser maintenant' })))
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Synchronisé'))
  })

  it('signs out but keeps the sessions on the device', async () => {
    const { auth, repo, remote } = setup()
    remote.records.push(remoteSession('from-phone', 5))
    auth.accounts.set('moi@example.com', 'motdepasse1')
    await signInVia('moi@example.com', 'motdepasse1')
    await waitFor(() => expect(repo.records).toHaveLength(1))
    fireEvent.click(screen.getByRole('button', { name: 'Se déconnecter' }))
    expect(await screen.findByLabelText('E-mail')).toBeTruthy()
    expect(repo.records).toHaveLength(1)
  })
})
