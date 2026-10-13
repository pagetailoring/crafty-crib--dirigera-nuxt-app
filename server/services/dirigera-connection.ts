import type { DirigeraClient } from 'dirigera'

export function createDirigeraConnection(
  connect: () => Promise<DirigeraClient>
) {
  let client: Promise<DirigeraClient> | undefined
  let closed = false
  const subscribers = new Set<() => void>()

  return {
    getClient() {
      if (closed)
        return Promise.reject(new Error('The Dirigera connection is closed.'))
      client ??= connect()
        .then(connected => {
          if (closed) {
            connected.stopListeningForUpdates()
            throw new Error('The Dirigera connection is closed.')
          }
          connected.startListeningForUpdates(event => {
            if (event.type !== 'pong') {
              for (const notify of subscribers) notify()
            }
          })
          return connected
        })
        .catch(error => {
          client = undefined
          throw error
        })
      return client
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
