import { createUpdateSubscription } from '../services/update-subscription'

export function useDirigeraUpdates(refresh: () => void) {
  const config = useRuntimeConfig()
  let stop: (() => void) | null = null

  onMounted(async () => {
    const { token } = await $fetch<{ token: string }>('/api/dirigera/session')
    const url = new URL(config.public.dirigeraWebSocketUrl)
    url.searchParams.set('token', token)

    stop = createUpdateSubscription({
      url: url.toString(),
      refresh,
      document,
      openWebSocket: socketUrl => {
        const socket = new WebSocket(socketUrl)
        return {
          addEventListener: (name, listener) =>
            socket.addEventListener(name, listener),
          close: () => socket.close(),
        }
      },
    })
  })

  onUnmounted(() => stop?.())
}
