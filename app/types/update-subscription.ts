export interface EventTargetLike {
  addEventListener(name: string, listener: (event: EventLike) => void): void
}

export interface EventLike {
  type?: string
  data?: unknown
}

export interface DocumentLike extends EventTargetLike {
  hidden: boolean
  removeEventListener(name: string, listener: () => void): void
}

export interface WebSocketLike extends EventTargetLike {
  close(): void
}
