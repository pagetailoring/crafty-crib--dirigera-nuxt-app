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

  it('changes device color temperature', async () => {
    const wrapper = await mountSuspended(DeviceControls, {
      props: { device: device({ colorTemperature: 3000 }) },
    })

    const input = wrapper.get('[aria-label="Lamp color temperature"]')
    await input.setValue(3500)
    await input.trigger('change')

    expect(client.controlDevice).toHaveBeenCalledWith('lamp', 'DEVICE', {
      type: 'setColorTemperature',
      colorTemperature: 3500,
    })
  })

  it('changes device hue with its current saturation', async () => {
    const wrapper = await mountSuspended(DeviceControls, {
      props: {
        device: device({ colorHue: 20, colorSaturation: 0.75 }),
      },
    })

    const input = wrapper.get('[aria-label="Lamp hue"]')
    await input.setValue(120)
    await input.trigger('change')

    expect(client.controlDevice).toHaveBeenCalledWith('lamp', 'DEVICE', {
      type: 'setColor',
      colorHue: 120,
      colorSaturation: 0.75,
    })
  })

  it('changes device saturation with its current hue', async () => {
    const wrapper = await mountSuspended(DeviceControls, {
      props: {
        device: device({ colorHue: 120, colorSaturation: 0.5 }),
      },
    })

    const input = wrapper.get('[aria-label="Lamp saturation"]')
    await input.setValue(0.8)
    await input.trigger('change')

    expect(client.controlDevice).toHaveBeenCalledWith('lamp', 'DEVICE', {
      type: 'setColor',
      colorHue: 120,
      colorSaturation: 0.8,
    })
  })

  it('pauses a playing device', async () => {
    const wrapper = await mountSuspended(DeviceControls, {
      props: { device: device({ playback: 'playbackPlaying' }) },
    })

    await wrapper.get('[aria-label="Pause Lamp"]').trigger('click')

    expect(client.controlDevice).toHaveBeenCalledWith('lamp', 'DEVICE', {
      type: 'setPlayback',
      playback: 'playbackPaused',
    })
  })

  it('moves playback to the next item', async () => {
    const wrapper = await mountSuspended(DeviceControls, {
      props: {
        device: device({
          playback: 'playbackPaused',
          playbackNextAvailable: true,
        }),
      },
    })

    await wrapper.get('[aria-label="Next on Lamp"]').trigger('click')

    expect(client.controlDevice).toHaveBeenCalledWith('lamp', 'DEVICE', {
      type: 'setPlayback',
      playback: 'playbackNext',
    })
  })
})
