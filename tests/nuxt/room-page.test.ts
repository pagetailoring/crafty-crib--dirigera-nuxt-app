import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import { useDeviceFiltersStore } from '../../app/stores/device-filters'
import { useDirigeraCacheStore } from '../../app/stores/cache'
import RoomPage from '../../app/pages/room/[id].vue'
import TheHeader from '../../app/components/TheHeader.vue'

const { client, devices, scenes, state } = vi.hoisted(() => ({
  client: {
    listRooms: vi.fn().mockResolvedValue([
      { id: 'kitchen', name: 'Kitchen', quickControls: [] },
      { id: 'living-room', name: 'Living Room', quickControls: [] },
      { id: 'empty', name: 'Empty', quickControls: [] },
    ]),
    activateScene: vi.fn().mockResolvedValue(undefined),
  },
  devices: [
    {
      id: 'light',
      type: 'light',
      deviceType: 'light',
      attributes: { customName: 'Kitchen lamp', model: 'TRADFRI bulb' },
      capabilities: { canReceive: [], canSend: [] },
      room: { id: 'kitchen', name: 'Kitchen' },
      deviceSet: [],
      remoteLinks: ['remote'],
      isReachable: true,
    },
    {
      id: 'remote',
      type: 'controller',
      deviceType: 'lightController',
      attributes: { customName: 'Living room remote', model: 'STYRBAR' },
      capabilities: { canReceive: [], canSend: [] },
      room: { id: 'living-room', name: 'Living Room' },
      deviceSet: [],
      remoteLinks: [],
      isReachable: true,
    },
  ],
  scenes: [
    {
      id: 'evening',
      info: { name: 'Evening' },
      triggers: [],
      actions: [{ type: 'device', deviceId: 'light', attributes: {} }],
      commands: [],
    },
  ],
  state: { scenesUnavailable: false, devicesUnavailable: false },
}))

mockNuxtImport('useDirigera', () => () => client)
mockNuxtImport('useFetch', () => (url: string) => {
  const isDevices = url.endsWith('/devices')
  const unavailable = isDevices
    ? state.devicesUnavailable
    : state.scenesUnavailable
  return {
    data: ref(unavailable ? null : isDevices ? devices : scenes),
    error: ref(unavailable ? new Error('Request failed') : null),
  }
})

describe('Room page', () => {
  beforeEach(() => {
    state.scenesUnavailable = false
    state.devicesUnavailable = false
    client.activateScene.mockClear()
    useDirigeraCacheStore(useNuxtApp().$pinia).rooms = undefined
    useDeviceFiltersStore(useNuxtApp().$pinia).selectedFilters = ['all']
  })

  it('uses the new cards for the room without the devices page filters', async () => {
    useDeviceFiltersStore(useNuxtApp().$pinia).selectedFilters = [
      'room:living-room',
    ]
    const wrapper = await mountSuspended(RoomPage, { route: '/room/kitchen' })
    const header = await mountSuspended(TheHeader, { route: '/room/kitchen' })
    const cards = wrapper.findAllComponents({ name: 'DeviceItemCard' })

    expect(wrapper.get('h1').text()).toBe('Kitchen')
    expect(header.text()).toContain('Kitchen')
    expect(header.findComponent({ name: 'DeviceFilters' }).exists()).toBe(false)
    expect(cards).toHaveLength(1)
    expect(cards[0]!.props('device').id).toBe('light')
    expect(wrapper.text()).toContain('TRADFRI bulb')

    await cards[0]!.get('button[aria-expanded]').trigger('click')
    await flushPromises()
    expect(cards[0]!.text()).toContain('Living room remote')
    expect(
      cards[0]!.get('a[href="/scenes/evening"]').attributes('aria-label')
    ).toBe('Edit Evening')
    await cards[0]!.get('button[aria-label="Trigger Evening"]').trigger('click')
    await flushPromises()
    expect(client.activateScene).toHaveBeenCalledWith('evening')
    wrapper.unmount()
    header.unmount()
  })

  it('shows the devices belonging to another room', async () => {
    const wrapper = await mountSuspended(RoomPage, {
      route: '/room/living-room',
    })
    const cards = wrapper.findAllComponents({ name: 'DeviceItemCard' })
    expect(cards).toHaveLength(1)
    expect(cards[0]!.props('device').id).toBe('remote')
    expect(wrapper.get('h1').text()).toBe('Living Room')
    wrapper.unmount()
  })

  it('shows the empty room state', async () => {
    const wrapper = await mountSuspended(RoomPage, { route: '/room/empty' })
    expect(wrapper.findComponent({ name: 'DeviceItemCard' }).exists()).toBe(
      false
    )
    expect(wrapper.text()).toContain('No devices')
    wrapper.unmount()
  })

  it('keeps device cards available when scenes cannot be loaded', async () => {
    state.scenesUnavailable = true
    const wrapper = await mountSuspended(RoomPage, { route: '/room/kitchen' })
    expect(wrapper.text()).toContain('Unable to load scene links')
    expect(wrapper.findComponent({ name: 'DeviceItemCard' }).exists()).toBe(
      true
    )
    wrapper.unmount()
  })

  it('reports device loading errors without an empty room message', async () => {
    state.devicesUnavailable = true
    const wrapper = await mountSuspended(RoomPage, { route: '/room/kitchen' })
    expect(wrapper.text()).toContain('Unable to load the room')
    expect(wrapper.text()).not.toContain('No devices')
    wrapper.unmount()
  })
})
