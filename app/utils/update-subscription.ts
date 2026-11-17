import type {
  DocumentLike,
  EventLike,
  WebSocketLike,
} from '~/types/update-subscription'

/** Subscribe to backend updates and refresh again when the document becomes visible. */
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
  /** Refresh data when the backend announces an update. */
  const refreshAfterUpdate = (event: EventLike) => {
    if (event.data === 'update') refresh()
  }
  /** Refresh stale data when the document returns to the foreground. */
  const refreshWhenVisible = () => {
    if (!document.hidden) refresh()
  }

  socket.addEventListener('message', refreshAfterUpdate)
  document.addEventListener('visibilitychange', refreshWhenVisible)

  /** Close the update socket and remove the document visibility listener. */
  return () => {
    socket.close()
    document.removeEventListener('visibilitychange', refreshWhenVisible)
  }
}
