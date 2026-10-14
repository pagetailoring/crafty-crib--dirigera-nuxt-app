import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
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

const getSlider = (wrapper: VueWrapper, label: string) => {
  const slider = wrapper
    .findAllComponents({ name: 'USlider' })
    .find(component => component.vm.$attrs['aria-label'] === label)
  if (!slider) throw new Error(`Unable to find slider: ${label}`)
  return slider
}

const changeSlider = async (
  wrapper: VueWrapper,
  label: string,
  value: number
) => {
  getSlider(wrapper, label).vm.$emit('change', { target: { value } })
  await wrapper.vm.$nextTick()
}

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

    await changeSlider(wrapper, 'Lamp light level', 45)

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
    const slider = getSlider(wrapper, 'Lamp light level')

    await changeSlider(wrapper, 'Lamp light level', 45)

    expect(slider.props('disabled')).toBe(true)

    command.resolve(undefined)
    await flushPromises()
    expect(slider.props('disabled')).toBe(false)
  })

  it('changes device color temperature', async () => {
    const wrapper = await mountSuspended(DeviceControls, {
      props: { device: device({ colorTemperature: 3000 }) },
    })

    await changeSlider(wrapper, 'Lamp color temperature', 3500)

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

      await changeSlider(wrapper, label, value)

      for (const disabledLabel of disabledLabels) {
        expect(getSlider(wrapper, disabledLabel).props('disabled')).toBe(true)
      }

      command.resolve(undefined)
      await flushPromises()

      for (const disabledLabel of disabledLabels) {
        expect(getSlider(wrapper, disabledLabel).props('disabled')).toBe(false)
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

      await changeSlider(wrapper, label, value)

      command.reject(new Error('Command failed'))
      await flushPromises()

      expect(errorHandler).toHaveBeenCalled()
      for (const disabledLabel of disabledLabels) {
        expect(getSlider(wrapper, disabledLabel).props('disabled')).toBe(false)
      }
    }
  )

  it('changes device hue with its current saturation', async () => {
    const wrapper = await mountSuspended(DeviceControls, {
      props: {
        device: device({ colorHue: 20, colorSaturation: 0.75 }),
      },
    })

    await changeSlider(wrapper, 'Lamp hue', 120)

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

    await changeSlider(wrapper, 'Lamp saturation', 0.8)

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
    await changeSlider(wrapper, 'Lamp hue', 120)

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

    await changeSlider(wrapper, 'Lamp volume', 30)

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
