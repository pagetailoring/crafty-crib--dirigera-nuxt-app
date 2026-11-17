import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import DevicesPage from '~/pages/devices.vue'
import TheHeader from '~/components/TheHeader.vue'

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

const { activateScene } = vi.hoisted(() => ({
  activateScene: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../app/composables/useDirigera', () => ({
  useDirigera: () => ({ activateScene }),
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

  it('toggles linked devices and scenes in a single collapsible section', async () => {
    activateScene.mockClear()
    const wrapper = await mountSuspended(DevicesPage, { route: '/devices' })
    const cards = wrapper.findAllComponents({ name: 'DeviceItemCard' })
    const lightCard = cards[0]!
    const trigger = lightCard.get('button[aria-expanded]')

    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(lightCard.text()).not.toContain('Living room remote')
    expect(lightCard.text()).not.toContain('Evening')

    await trigger.trigger('click')
    await flushPromises()
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(lightCard.text()).toContain('Living room remote')
    expect(
      lightCard.get('a[href="/scenes/evening"]').attributes('aria-label')
    ).toBe('Edit Evening')
    const sceneTrigger = lightCard.get('button[aria-label="Trigger Evening"]')
    expect(sceneTrigger.text()).toContain('Evening')
    expect(
      sceneTrigger.element.compareDocumentPosition(
        lightCard.getComponent({ name: 'UBadge' }).element
      ) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    await sceneTrigger.trigger('click')
    await flushPromises()
    expect(activateScene).toHaveBeenCalledOnce()
    expect(activateScene).toHaveBeenCalledWith('evening')

    await trigger.trigger('click')
    await flushPromises()
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(lightCard.get('[data-slot="content"]').isVisible()).toBe(false)

    expect(cards[1]!.find('button[aria-expanded]').exists()).toBe(false)
    const remoteCard = cards[2]!
    await remoteCard.get('button[aria-expanded]').trigger('click')
    await flushPromises()
    expect(remoteCard.text()).toContain('Living room lamp')
    expect(
      remoteCard.get('a[href="/scenes/evening"]').attributes('aria-label')
    ).toBe('Edit Evening')
    expect(cards[3]!.find('button[aria-expanded]').exists()).toBe(false)
    wrapper.unmount()
  })
})
