import type { SyncStatus } from './useCloudSync'

export const SYNC_LABELS: Record<SyncStatus, string> = {
  disabled: '',
  'signed-out': 'Se connecter pour synchroniser',
  syncing: 'Synchronisation…',
  synced: 'Synchronisé',
  offline: 'Hors ligne : synchro au retour du réseau',
  error: 'Erreur de synchronisation',
}
