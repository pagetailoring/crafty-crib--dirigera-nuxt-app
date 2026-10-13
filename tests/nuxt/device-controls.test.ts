import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DeviceControls from '../../app/components/DeviceControls.vue'
import type { Device } from '../../app/services/dirigera-client'

const { client } = vi.hoisted(() => ({
  client: {
    controlDevice: vi.fn().mockResolvedValue(undefined),
    getPlayItemImage: vi.fn().mockResolvedValue('data:image/png;base64,image'),
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

const pendingControlCases = [
  {
    name: 'color temperature',
    label: 'Lamp color temperature',
    value: 3500,
    device: { colorTemperature: 3000 },
    disabledLabels: ['Lamp color temperature'],
  },
  {
    name: 'color',
    label: 'Lamp hue',
    value: 120,
    device: { colorHue: 20, colorSaturation: 0.75 },
    disabledLabels: ['Lamp hue', 'Lamp saturation'],
  },
  {
    name: 'volume',
    label: 'Lamp volume',
    value: 30,
    device: { volume: 20 },
    disabledLabels: ['Lamp volume'],
  },
] satisfies Array<{
  name: string
  label: string
  value: number
  device: Partial<Device>
  disabledLabels: string[]
}>

describe('Device controls', () => {
  beforeEach(() => {
    client.controlDevice.mockReset().mockResolvedValue(undefined)
    client.getPlayItemImage
      .mockReset()
      .mockResolvedValue('data:image/png;base64,image')
  })

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

  it('disables the light level while its command is pending', async () => {
    const command = Promise.withResolvers<undefined>()
    client.controlDevice.mockReturnValueOnce(command.promise)
    const wrapper = await mountSuspended(DeviceControls, {
      props: { device: device({ lightLevel: 70 }) },
    })
    const input = wrapper.get('[aria-label="Lamp light level"]')

    await input.setValue(45)
    await input.trigger('change')

    expect(input.attributes('disabled')).toBeDefined()

    command.resolve(undefined)
    await flushPromises()
    expect(input.attributes('disabled')).toBeUndefined()
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

  it.each(pendingControlCases)(
    'disables the $name control while its command is pending',
    async ({ label, value, device: deviceOverrides, disabledLabels }) => {
      const command = Promise.withResolvers<undefined>()
      client.controlDevice.mockReturnValueOnce(command.promise)
      const wrapper = await mountSuspended(DeviceControls, {
        props: { device: device(deviceOverrides) },
      })

      const input = wrapper.get(`[aria-label="${label}"]`)
      await input.setValue(value)
      await input.trigger('change')

      for (const disabledLabel of disabledLabels) {
        expect(
          wrapper.get(`[aria-label="${disabledLabel}"]`).attributes('disabled')
        ).toBeDefined()
      }

      command.resolve(undefined)
      await flushPromises()

      for (const disabledLabel of disabledLabels) {
        expect(
          wrapper.get(`[aria-label="${disabledLabel}"]`).attributes('disabled')
        ).toBeUndefined()
      }
    }
  )

  it.each(pendingControlCases)(
    'restores the $name control after its command fails',
    async ({ label, value, device: deviceOverrides, disabledLabels }) => {
      const command = Promise.withResolvers<undefined>()
      const errorHandler = vi.fn()
      client.controlDevice.mockReturnValueOnce(command.promise)
      const wrapper = await mountSuspended(DeviceControls, {
        props: { device: device(deviceOverrides) },
        global: { config: { errorHandler } },
      })

      const input = wrapper.get(`[aria-label="${label}"]`)
      await input.setValue(value)
      await input.trigger('change')

      command.reject(new Error('Command failed'))
      await flushPromises()

      expect(errorHandler).toHaveBeenCalled()
      for (const disabledLabel of disabledLabels) {
        expect(
          wrapper.get(`[aria-label="${disabledLabel}"]`).attributes('disabled')
        ).toBeUndefined()
      }
    }
  )

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

  it('uses refreshed saturation when changing hue', async () => {
    const wrapper = await mountSuspended(DeviceControls, {
      props: {
        device: device({ colorHue: 20, colorSaturation: 0.25 }),
      },
    })

    await wrapper.setProps({
      device: device({ colorHue: 30, colorSaturation: 0.9 }),
    })
    const input = wrapper.get('[aria-label="Lamp hue"]')
    await input.setValue(120)
    await input.trigger('change')

    expect(client.controlDevice).toHaveBeenCalledWith('lamp', 'DEVICE', {
      type: 'setColor',
      colorHue: 120,
      colorSaturation: 0.9,
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

  it.each(['playbackBuffering', 'playbackIdle'])(
    'pauses a device in the %s state',
    async playback => {
      const wrapper = await mountSuspended(DeviceControls, {
        props: { device: device({ playback }) },
      })

      await wrapper.get('[aria-label="Pause Lamp"]').trigger('click')

      expect(client.controlDevice).toHaveBeenCalledWith('lamp', 'DEVICE', {
        type: 'setPlayback',
        playback: 'playbackPaused',
      })
    }
  )

  it('plays a paused device', async () => {
    const wrapper = await mountSuspended(DeviceControls, {
      props: { device: device({ playback: 'playbackPaused' }) },
    })

    await wrapper.get('[aria-label="Play Lamp"]').trigger('click')

    expect(client.controlDevice).toHaveBeenCalledWith('lamp', 'DEVICE', {
      type: 'setPlayback',
      playback: 'playbackPlaying',
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

  it('changes device volume', async () => {
    const wrapper = await mountSuspended(DeviceControls, {
      props: { device: device({ volume: 20 }) },
    })

    const input = wrapper.get('[aria-label="Lamp volume"]')
    await input.setValue(30)
    await input.trigger('change')

    expect(client.controlDevice).toHaveBeenCalledWith('lamp', 'DEVICE', {
      type: 'setVolume',
      volume: 30,
    })
  })

  it('shows the current play item and its image', async () => {
    const wrapper = await mountSuspended(DeviceControls, {
      props: {
        device: device({
          playItem: 'Artist - Song',
          nextPlayItem: 'Artist - Next song',
        }),
      },
    })

    expect(wrapper.text()).toContain('Now playing: Artist - Song')
    expect(wrapper.text()).toContain('Next: Artist - Next song')
    expect(wrapper.get('img').attributes('src')).toBe(
      'data:image/png;base64,image'
    )
  })
})
