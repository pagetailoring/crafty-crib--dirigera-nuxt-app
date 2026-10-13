import { defineStore } from 'pinia'

import type { DirigeraStatus } from '../../shared/types/dirigera-status'

export const useDirigeraStateStore = defineStore('state', () => {
  const status = ref<DirigeraStatus>({ state: 'idle' })
  const pending = ref(false)
  const error = ref<Error | null>(null)
  let active: Promise<DirigeraStatus> | undefined

  function refresh() {
    if (active) return active

    pending.value = true
    error.value = null
    active = $fetch<DirigeraStatus>('/api/dirigera/status')
      .then(nextStatus => {
        status.value = nextStatus
        return nextStatus
      })
      .catch(cause => {
        error.value = cause instanceof Error ? cause : new Error(String(cause))
        throw cause
      })
      .finally(() => {
        pending.value = false
        active = undefined
      })
    return active
  }

  return { status, pending, error, refresh }
})
