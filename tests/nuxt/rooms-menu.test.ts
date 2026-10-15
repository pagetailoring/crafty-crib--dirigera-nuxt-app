import { createPinia, setActivePinia } from 'pinia'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import { expect, it, vi } from 'vitest'

import ListMenuLinks from '../../app/components/rooms/ListMenuLinks.vue'
import { useDirigeraCacheStore } from '../../app/stores/cache'

const { listRooms } = vi.hoisted(() => ({ listRooms: vi.fn() }))
mockNuxtImport('useDirigera', () => () => ({ listRooms }))

it('shows loading only while the room list request is pending', async () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const cache = useDirigeraCacheStore()
  let finish!: (value: []) => void
  listRooms.mockReturnValue(
    new Promise<[]>(resolve => {
      finish = resolve
    })
  )
  const wrapper = await mountSuspended(ListMenuLinks, {
    global: { plugins: [pinia], stubs: { UNavigationMenu: true } },
  })

  expect(wrapper.text()).not.toContain('Loading...')
  const request = cache.loadRooms()
  await nextTick()
  expect(wrapper.text()).toContain('Loading...')

  finish([])
  await request
  await nextTick()
  expect(wrapper.text()).not.toContain('Loading...')

  cache.pending.scenes = true
  await nextTick()
  expect(wrapper.text()).not.toContain('Loading...')
  wrapper.unmount()
})
