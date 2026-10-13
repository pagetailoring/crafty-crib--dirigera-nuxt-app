import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'

import DeviceControls from '../../app/components/DeviceControls.vue'
import type { Device } from '../../app/services/dirigera-client'

const { client } = vi.hoisted(() => ({
  client: {
    controlDevice: vi.fn().mockResolvedValue(undefined),
  },
}))

mockNuxtImport('useDirigera', () => () => client)

const device = (overrides: Partial<Device> = {}): Device => ({
  id: 'lamp',
  name: 'Lamp',
  type: 'DEVICE',
  isReachable: true,
  lastSeen: '2026-10-13T01:00:00.000Z',
  batteryPercentage: null,
  isOn: null,
  lightLevel: null,
  colorTemperature: null,
  colorSaturation: null,
  colorHue: null,
  playback: null,
  playbackNextAvailable: null,
  playbackPreviousAvailable: null,
  volume: null,
  playItem: null,
  nextPlayItem: null,
  temperature: null,
  humidity: null,
  pm25: null,
  vocIndex: null,
  co2: null,
  isOpen: null,
  isDetected: null,
  illuminance: null,
  ...overrides,
})

describe('Device controls', () => {
  it('toggles device power', async () => {
    const wrapper = await mountSuspended(DeviceControls, {
      props: { device: device({ isOn: true }) },
    })

    await wrapper.get('[aria-label="Turn Lamp off"]').trigger('click')

    expect(client.controlDevice).toHaveBeenCalledWith('lamp', 'DEVICE', {
      type: 'setIsOn',
      isOn: false,
    })
  })

  it('changes device light level', async () => {
    const wrapper = await mountSuspended(DeviceControls, {
      props: { device: device({ lightLevel: 70 }) },
    })

    await wrapper.get('[aria-label="Lamp light level"]').setValue(45)
    await wrapper.get('[aria-label="Lamp light level"]').trigger('change')

    expect(client.controlDevice).toHaveBeenCalledWith('lamp', 'DEVICE', {
      type: 'setLightLevel',
      lightLevel: 45,
    })
  })
})
