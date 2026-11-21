import type { DirigeraClient } from 'dirigera'
import type {
  DirigeraStatus,
  DirigeraUnavailableReason,
} from '../../shared/types/dirigera-status'

export class DirigeraConnectionError extends Error {
  readonly statusCode = 503

  constructor(
    readonly reason: DirigeraUnavailableReason,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = 'DirigeraConnectionError'
  }
}

export function createDirigeraConnection(
  connect: () => Promise<DirigeraClient>
) {
  let client: Promise<DirigeraClient> | undefined
  let closed = false
  let status: DirigeraStatus = { state: 'idle' }
  const subscribers = new Set<() => void>()

  return {
    getClient() {
      if (closed)
        return Promise.reject(new Error('The Dirigera connection is closed.'))
      if (!client) {
        status = { state: 'connecting' }
        client = connect()
          .then(async connected => {
            if (closed) {
              connected.stopListeningForUpdates()
              throw new Error('The Dirigera connection is closed.')
            }
            await connected.home()
            connected.startListeningForUpdates(event => {
              if (event.type !== 'pong') {
                for (const notify of subscribers) notify()
              }
            })
            status = {
              state: 'ready',
              checkedAt: new Date().toISOString(),
            }
            return connected
          })
          .catch(error => {
            client = undefined
            status = {
              state: 'unavailable',
              checkedAt: new Date().toISOString(),
              reason:
                error instanceof DirigeraConnectionError
                  ? error.reason
                  : 'hub-unreachable',
            }
            throw error
          })
      }
      return client
    },
    getStatus() {
      return status
    },
    subscribe(notify: () => void) {
      subscribers.add(notify)
      return () => {
        subscribers.delete(notify)
      }
    },
    async close() {
      closed = true
      subscribers.clear()
      const connected = await client?.catch(() => undefined)
      connected?.stopListeningForUpdates()
    },
  }
}
