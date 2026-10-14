import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DeviceControls from '../../app/components/DeviceControls.vue'
import type { Device } from '../../app/services/dirigera-client'
import { DEVICE_CONTROL_THROTTLE_MS } from '../../config/device-controls'

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
  deviceType: 'light',
  productName: 'TRADFRI bulb',
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
  getSlider(wrapper, label).vm.$emit('update:modelValue', value)
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

  it('updates the displayed value immediately and throttles device commands', async () => {
    const wrapper = await mountSuspended(DeviceControls, {
      props: { device: device({ lightLevel: 70 }) },
    })
    vi.useFakeTimers()

    try {
      await changeSlider(wrapper, 'Lamp light level', 45)
      await flushPromises()
      await changeSlider(wrapper, 'Lamp light level', 50)
      await changeSlider(wrapper, 'Lamp light level', 55)

      expect(wrapper.text()).toContain('Light level 55%')
      expect(client.controlDevice).toHaveBeenCalledTimes(1)

      await vi.advanceTimersByTimeAsync(DEVICE_CONTROL_THROTTLE_MS)

      expect(client.controlDevice).toHaveBeenCalledTimes(2)
      expect(client.controlDevice).toHaveBeenLastCalledWith('lamp', 'DEVICE', {
        type: 'setLightLevel',
        lightLevel: 55,
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('exposes the full temperature range reported by the hub', async () => {
    const wrapper = await mountSuspended(DeviceControls, {
      props: {
        device: {
          ...device({ colorTemperature: 3000 }),
          colorTemperatureMin: 6500,
          colorTemperatureMax: 2000,
        },
      },
    })
    const slider = getSlider(wrapper, 'Lamp color temperature')
    expect(slider.props('min')).toBe(2000)
    expect(slider.props('max')).toBe(6500)
    await changeSlider(wrapper, 'Lamp color temperature', 6500)
    expect(client.controlDevice).toHaveBeenCalledWith('lamp', 'DEVICE', {
      type: 'setColorTemperature',
      colorTemperature: 6500,
    })
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
