export type DirigeraUnavailableReason =
  'missing-token' | 'discovery-failed' | 'hub-unreachable'

export type DirigeraStatus =
  | { state: 'idle' }
  | { state: 'connecting' }
  | { state: 'ready'; checkedAt: string }
  | {
      state: 'unavailable'
      checkedAt: string
      reason: DirigeraUnavailableReason
    }
