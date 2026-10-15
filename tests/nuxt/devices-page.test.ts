import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import DevicesPage from '../../app/pages/devices.vue'

const { devices } = vi.hoisted(() => ({
  devices: [
    {
      id: 'light',
      type: 'light',
      deviceType: 'light',
      attributes: { customName: 'Living room lamp', model: 'TRADFRI bulb' },
      capabilities: { canReceive: [], canSend: [] },
      room: { id: 'living-room', name: 'Living Room' },
      deviceSet: [],
      remoteLinks: [],
      isReachable: true,
    },
    {
      id: 'plug',
      type: 'outlet',
      deviceType: 'outlet',
      attributes: { customName: 'Kitchen plug', model: 'INSPELNING' },
      capabilities: { canReceive: [], canSend: [] },
      room: { id: 'kitchen', name: 'Kitchen' },
      deviceSet: [],
      remoteLinks: [],
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
    {
      id: 'sensor',
      type: 'sensor',
      deviceType: 'motionSensor',
      attributes: { customName: 'Hall sensor', model: 'VALLHORN' },
      capabilities: { canReceive: [], canSend: [] },
      deviceSet: [],
      remoteLinks: [],
      isReachable: true,
    },
  ],
}))

mockNuxtImport('useFetch', () => () => ({
  data: ref(devices),
  error: ref(null),
}))

describe('Devices page', () => {
  it('filters devices by multiple IKEA product categories and a room', async () => {
    const wrapper = await mountSuspended(DevicesPage, { route: '/devices' })
    const filter = wrapper.findComponent({ name: 'USelectMenu' })
    const options = filter
      .props('items')
      .filter((item: { type?: string }) => !item.type)
      .map((item: { label: string; value: string }) => [item.label, item.value])

    expect(filter.props('multiple')).toBe(true)
    expect(options).toEqual([
      ['All', 'all'],
      ['Lights', 'type:light'],
      ['Plugs', 'type:outlet'],
      ['Remotes', 'type:controller'],
      ['Sensors', 'type:sensor'],
      ['Kitchen', 'room:kitchen'],
      ['Living Room', 'room:living-room'],
      ['No room', 'room:unassigned'],
    ])

    filter.vm.$emit('update:modelValue', ['type:controller'])
    await flushPromises()
    expect(wrapper.text()).toContain('Living room remote')
    expect(wrapper.text()).not.toContain('Living room lamp')
    expect(wrapper.text()).not.toContain('Kitchen plug')

    filter.vm.$emit('update:modelValue', [
      'type:light',
      'type:controller',
      'room:living-room',
    ])
    await flushPromises()
    expect(wrapper.text()).toContain('Living room lamp')
    expect(wrapper.text()).toContain('Living room remote')
    expect(wrapper.text()).not.toContain('Kitchen plug')
    expect(wrapper.text()).not.toContain('Hall sensor')
  })
})
