declare global {
  /** Why the server cannot connect to the DIRIGERA hub. */
  type DirigeraUnavailableReason =
    'missing-token' | 'discovery-failed' | 'hub-unreachable'

  /** State of the server's connection to the DIRIGERA hub. */
  type DirigeraStatus =
    | { state: 'idle' }
    | { state: 'connecting' }
    | { state: 'ready'; checkedAt: string }
    | {
        state: 'unavailable'
        checkedAt: string
        reason: DirigeraUnavailableReason
      }
}

export {}
