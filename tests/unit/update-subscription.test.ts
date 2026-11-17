import { describe, expect, it, vi } from 'vitest'

import { createUpdateSubscription } from '~/utils/update-subscription'

describe('Dirigera update subscription', () => {
  it('refreshes after a socket update and when the page becomes visible', () => {
    const refresh = vi.fn()
    const listeners = new Map<string, () => void>()
    const document = {
      hidden: false,
      addEventListener: vi.fn((name: string, listener: () => void) => {
        listeners.set(name, listener)
      }),
      removeEventListener: vi.fn(),
    }
    const socket = { addEventListener: vi.fn(), close: vi.fn() }
    const openWebSocket = vi.fn(() => socket)

    const stop = createUpdateSubscription({
      url: 'ws://localhost:4000?token=session-token',
      refresh,
      document,
      openWebSocket,
    })

    const messageListener = socket.addEventListener.mock.calls.find(
      ([name]) => name === 'message'
    )?.[1]
    messageListener({ data: 'ignored' })
    expect(refresh).not.toHaveBeenCalled()

    messageListener({ data: 'update' })
    listeners.get('visibilitychange')?.({})

    expect(refresh).toHaveBeenCalledTimes(2)

    stop()
    expect(socket.close).toHaveBeenCalledOnce()
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    )
  })
})
