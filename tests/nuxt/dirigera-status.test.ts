import { createPinia, setActivePinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDirigeraStateStore } from '../../app/stores/state'

const { fetch } = vi.hoisted(() => ({ fetch: vi.fn() }))

mockNuxtImport('$fetch', () => fetch)

describe('Dirigera status store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    fetch.mockReset()
  })

  it('exposes the safe server connection state', async () => {
    fetch.mockResolvedValue({
      state: 'unavailable',
      checkedAt: '2026-10-14T00:00:00.000Z',
      reason: 'hub-unreachable',
    })
    const store = useDirigeraStateStore()

    await store.refresh()

    expect(fetch).toHaveBeenCalledWith('/api/dirigera/status')
    expect(store.status).toMatchObject({
      state: 'unavailable',
      reason: 'hub-unreachable',
    })
    expect(store.pending).toBe(false)
  })

  it('retains a failed status request for the UI', async () => {
    fetch.mockRejectedValue(new Error('offline'))
    const store = useDirigeraStateStore()

    await expect(store.refresh()).rejects.toThrow('offline')

    expect(store.error?.message).toBe('offline')
    expect(store.pending).toBe(false)
  })
})
