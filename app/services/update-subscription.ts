interface EventTargetLike {
  addEventListener(name: string, listener: (event: EventLike) => void): void
}

interface EventLike {
  type?: string
  data?: unknown
}

interface DocumentLike extends EventTargetLike {
  hidden: boolean
  removeEventListener(name: string, listener: () => void): void
}

interface WebSocketLike extends EventTargetLike {
  close(): void
}

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
