import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import { expect, it } from 'vitest'
import { useNuxtApp } from '#app'

import ListMenuLinks from '~/components/rooms/ListMenuLinks.vue'
import type { RoomSummary } from '~/types/dirigera-client'
import { useDirigeraCacheStore } from '~/stores/cache'

const room = (id: string, name: string): RoomSummary => ({
  id,
  name,
  temperature: null,
  humidity: null,
  pm25: null,
  vocIndex: null,
  co2: null,
  quickControls: [],
})

it('updates room navigation when cached rooms change', async () => {
  const cache = useDirigeraCacheStore(useNuxtApp().$pinia)
  cache.rooms = undefined
  const wrapper = await mountSuspended(ListMenuLinks)

  expect(wrapper.findAll('a')).toHaveLength(0)

  cache.rooms = {
    data: [room('kitchen', 'Kitchen')],
    refreshedAt: Date.now(),
    stale: false,
  }
  await nextTick()
  expect(wrapper.get('a[href="/room/kitchen"]').text()).toBe('Kitchen')

  cache.rooms = {
    data: [room('bedroom', 'Bedroom')],
    refreshedAt: Date.now(),
    stale: false,
  }
  await nextTick()
  expect(wrapper.find('a[href="/room/kitchen"]').exists()).toBe(false)
  expect(wrapper.get('a[href="/room/bedroom"]').text()).toBe('Bedroom')

  wrapper.unmount()
})
