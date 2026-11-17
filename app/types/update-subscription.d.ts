/** Minimal event-target contract required by update subscriptions. */
export interface EventTargetLike {
  addEventListener(name: string, listener: (event: EventLike) => void): void
}

/** Event payload consumed by update-subscription listeners. */
export interface EventLike {
  type?: string
  data?: unknown
}

/** Minimal document contract required for visibility-based refreshes. */
export interface DocumentLike extends EventTargetLike {
  hidden: boolean
  removeEventListener(name: string, listener: () => void): void
}

/** Minimal WebSocket contract required by an update subscription. */
export interface WebSocketLike extends EventTargetLike {
  close(): void
}
