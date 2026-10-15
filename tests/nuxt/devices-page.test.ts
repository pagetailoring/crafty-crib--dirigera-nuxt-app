import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import DevicesPage from '../../app/pages/devices.vue'
import TheHeader from '../../app/components/TheHeader.vue'

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
      remoteLinks: ['remote'],
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

mockNuxtImport('useFetch', () => (url: string) => ({
  data: ref(
    url.endsWith('/devices')
      ? devices
      : [
          {
            id: 'evening',
            info: { name: 'Evening' },
            triggers: [{ type: 'controller', trigger: { deviceId: 'remote' } }],
            actions: [{ type: 'device', deviceId: 'light', attributes: {} }],
            commands: [],
          },
        ]
  ),
  error: ref(null),
}))

describe('Devices page', () => {
  it('filters devices by multiple IKEA product categories and a room', async () => {
    const wrapper = await mountSuspended(DevicesPage, { route: '/devices' })
    const header = await mountSuspended(TheHeader, {
      route: '/devices',
    })
    const filter = header.find('[data-slot="right"]').findComponent({
      name: 'USelectMenu',
    })
    const options = filter
      .props('items')
      .filter((item: { type?: string }) => !item.type)
      .map((item: { label: string; value: string }) => [item.label, item.value])

    expect(filter.props('multiple')).toBe(true)
    expect(options).toEqual([
      ['FILTERS', 'all'],
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

    filter.vm.$emit('update:modelValue', ['all'])
    await flushPromises()
  })

  it('hides association details in counted accordion sections', async () => {
    const wrapper = await mountSuspended(DevicesPage, { route: '/devices' })
    const cards = wrapper.findAllComponents({ name: 'DeviceItemCard' })

    const lightAccordion = cards[0]!.findComponent({ name: 'UAccordion' })
    expect(
      lightAccordion.props('items').map((item: { label: string }) => item.label)
    ).toEqual(['Remotes (1)', 'Scenes (1)'])
    expect(cards[0]!.text()).not.toContain('Living room remote')
    expect(cards[0]!.text()).not.toContain('Evening')

    await cards[0]!.findAll('[data-slot="trigger"]')[0]!.trigger('click')
    await flushPromises()
    expect(cards[0]!.text()).toContain('Living room remote')

    await cards[0]!.findAll('[data-slot="trigger"]')[1]!.trigger('click')
    await flushPromises()
    expect(cards[0]!.text()).toContain('Evening')

    expect(cards[1]!.findComponent({ name: 'UAccordion' }).exists()).toBe(false)
    expect(
      cards[2]!.findComponent({ name: 'UAccordion' }).props('items')
    ).toMatchObject([{ label: 'Controls (1)' }, { label: 'Scenes (1)' }])
    expect(cards[3]!.findComponent({ name: 'UAccordion' }).exists()).toBe(false)
  })
})
