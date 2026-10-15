import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Device } from 'dirigera'
import type { DeviceAssociations } from '../../app/services/device-associations'

import DeviceItemCard from '../../app/components/device/ItemCard.vue'

const { controlDevice } = vi.hoisted(() => ({
  controlDevice: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../app/composables/useDirigera', () => ({
  useDirigera: () => ({ controlDevice }),
}))

const device = (type: Device['type'], isOn: boolean) =>
  ({
    id: type,
    type,
    deviceType: type,
    createdAt: '2026-10-15T00:00:00.000Z',
    lastSeen: '2026-10-15T00:00:00.000Z',
    attributes: {
      customName: `${type} device`,
      isOn,
      firmwareVersion: '1.0.0',
      hardwareVersion: '1.0.0',
      manufacturer: 'IKEA',
      model: 'Test device',
      serialNumber: type,
    },
    capabilities: { canReceive: [], canSend: [] },
    deviceSet: [],
    remoteLinks: [],
    isReachable: true,
  }) as Device

const associations = { devices: [], remotes: [], scenes: [] }

describe('Device item card power control', () => {
  beforeEach(() => {
    controlDevice.mockReset().mockResolvedValue(undefined)
  })

  it.each([
    ['light', 'light'],
    ['outlet', 'power'],
  ] as const)(
    'uses a %s switch without a visible label',
    async (type, mode) => {
      const wrapper = await mountSuspended(DeviceItemCard, {
        props: {
          device: device(type, true),
          associations,
          scenesAvailable: false,
        },
      })
      const powerSwitch = wrapper.findComponent({ name: 'UiSwitch' })

      expect(powerSwitch.props('mode')).toBe(mode)
      expect(powerSwitch.props('label')).toBeUndefined()
      expect(
        wrapper.find(`[aria-label="Turn ${type} device off"]`).exists()
      ).toBe(true)

      powerSwitch.vm.$emit('update:modelValue', false)
      await wrapper.vm.$nextTick()
      expect(powerSwitch.props('modelValue')).toBe(false)

      await flushPromises()
      expect(controlDevice).toHaveBeenCalledWith(type, 'DEVICE', {
        type: 'setIsOn',
        isOn: false,
      })
    }
  )

  it('keeps the status badge for another device type', async () => {
    const wrapper = await mountSuspended(DeviceItemCard, {
      props: {
        device: device('controller', true),
        associations,
        scenesAvailable: false,
      },
    })

    expect(wrapper.findComponent({ name: 'UiSwitch' }).exists()).toBe(false)
    expect(wrapper.text()).toContain('On')
  })

  it('links an associated scene to its direct page', async () => {
    const wrapper = await mountSuspended(DeviceItemCard, {
      props: {
        device: device('light', true),
        associations: {
          devices: [],
          remotes: [],
          scenes: [
            { id: 'evening', info: { name: 'Evening' } },
          ] as DeviceAssociations['scenes'],
        },
        scenesAvailable: true,
      },
    })

    await wrapper.find('[data-slot="trigger"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('a[href="/scenes/evening"]').text()).toContain('Evening')
  })
})
