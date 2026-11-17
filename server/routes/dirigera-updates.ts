import { defineWebSocketHandler } from 'h3'
import { dirigeraConnection } from '@@/server/utils/dirigera'
import { verifyUpdateToken } from '@@/server/utils/dirigera-session'

const subscriptions = new Map<string, () => void>()

export default defineWebSocketHandler({
  upgrade(request) {
    if (!verifyUpdateToken(new URL(request.url).searchParams.get('token'))) {
      return new Response('Unauthorized', { status: 401 })
    }
  },
  async open(peer) {
    subscriptions.set(
      peer.id,
      dirigeraConnection.subscribe(() => peer.send('update'))
    )
    try {
      await dirigeraConnection.getClient()
    } catch {
      subscriptions.get(peer.id)?.()
      subscriptions.delete(peer.id)
      peer.close(1011, 'The Dirigera connection is unavailable.')
    }
  },
  close(peer) {
    subscriptions.get(peer.id)?.()
    subscriptions.delete(peer.id)
  },
  error(peer) {
    subscriptions.get(peer.id)?.()
    subscriptions.delete(peer.id)
  },
})
