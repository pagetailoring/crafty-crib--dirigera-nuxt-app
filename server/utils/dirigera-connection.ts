import type { DirigeraClient } from 'dirigera'

/** Report a classified failure to establish a Dirigera hub connection. */
export class DirigeraConnectionError extends Error {
  readonly statusCode = 503

  /** Create a connection error with a public reason and an optional underlying cause. */
  constructor(
    readonly reason: DirigeraUnavailableReason,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = 'DirigeraConnectionError'
  }
}

/** Manage a lazy shared Dirigera connection, its status, and update subscribers. */
export function createDirigeraConnection(
  connect: () => Promise<DirigeraClient>
) {
  let client: Promise<DirigeraClient> | undefined
  let closed = false
  let status: DirigeraStatus = { state: 'idle' }
  const subscribers = new Set<() => void>()

  return {
    /** Return the active client or establish and verify a new hub connection. */
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
    /** Return the latest connection status without opening a connection. */
    getStatus() {
      return status
    },
    /** Register an update callback and return a function that unregisters it. */
    subscribe(notify: () => void) {
      subscribers.add(notify)
      /** Remove this callback from the connection's update subscribers. */
      return () => {
        subscribers.delete(notify)
      }
    },
    /** Close the shared connection and discard all update subscribers. */
    async close() {
      closed = true
      subscribers.clear()
      const connected = await client?.catch(() => undefined)
      connected?.stopListeningForUpdates()
    },
  }
}
