import type {
  DocumentLike,
  EventLike,
  WebSocketLike,
} from '~/types/update-subscription'

export function createUpdateSubscription({
  url,
  refresh,
  document,
  openWebSocket,
}: {
  url: string
  refresh: () => void
  document: DocumentLike
  openWebSocket: (url: string) => WebSocketLike
}) {
  const socket = openWebSocket(url)
  const refreshAfterUpdate = (event: EventLike) => {
    if (event.data === 'update') refresh()
  }
  const refreshWhenVisible = () => {
    if (!document.hidden) refresh()
  }

  socket.addEventListener('message', refreshAfterUpdate)
  document.addEventListener('visibilitychange', refreshWhenVisible)

  return () => {
    socket.close()
    document.removeEventListener('visibilitychange', refreshWhenVisible)
  }
}
