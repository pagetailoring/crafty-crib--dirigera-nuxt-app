import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Device } from 'dirigera'
import { defineComponent } from 'vue'
import DeviceItemCard from '~/components/device/ItemCard.vue'

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
const TooltipStub = defineComponent({
  name: 'UTooltip',
  props: {
    text: String,
    disabled: Boolean,
  },
  template: '<div data-tooltip><slot /></div>',
})

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

  it('updates the association trigger category and trailing icon with the device type', async () => {
    const wrapper = await mountSuspended(DeviceItemCard, {
      props: {
        device: device('controller', true),
        associations: {
          devices: [device('light', true)],
          remotes: [device('controller', true)],
          scenes: [],
        },
        scenesAvailable: false,
      },
    })

    const trigger = () => wrapper.get('button[aria-expanded]')
    expect(trigger().text()).toContain('remote connected to')
    expect(trigger().get('[data-slot="trailingIcon"]').classes()).toContain(
      'i-lucide:toggle-left'
    )

    await wrapper.setProps({ device: device('outlet', true) })

    expect(trigger().text()).toContain('plug connected to')
    expect(trigger().get('[data-slot="trailingIcon"]').classes()).toContain(
      'i-lucide:plug'
    )
  })

  it('toggles shared light controls from brightness and temperature buttons and sends updates', async () => {
    const light = device('light', true)
    light.attributes.lightLevel = 70
    light.attributes.colorTemperature = 3000
    light.attributes.colorTemperatureMin = 2000
    light.attributes.colorTemperatureMax = 6500
    light.attributes.colorHue = 20
    light.attributes.colorSaturation = 0.75
    light.capabilities.canReceive = [
      'lightLevel',
      'colorTemperature',
      'colorHue',
      'colorSaturation',
    ]
    const wrapper = await mountSuspended(DeviceItemCard, {
      props: {
        device: light,
        associations,
        scenesAvailable: false,
      },
      global: { stubs: { UTooltip: TooltipStub } },
    })
    const trigger = wrapper.get('[aria-label="Adjust light device brightness"]')
    const temperature = wrapper.get(
      '[aria-label="Adjust light device color temperature"]'
    )

    expect(trigger.text()).toBe('70%')
    expect(temperature.text()).toBe('3000 K')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(wrapper.get('[data-slot="content"]').isVisible()).toBe(false)
    expect(
      wrapper.findAllComponents({ name: 'UTooltip' }).map(tooltip => ({
        text: tooltip.props('text'),
        disabled: tooltip.props('disabled'),
      }))
    ).toEqual([
      { text: 'Set brightness', disabled: false },
      { text: 'Set color temperature', disabled: false },
    ])

    await trigger.trigger('click')
    await flushPromises()

    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(
      wrapper
        .findAllComponents({ name: 'UTooltip' })
        .every(tooltip => tooltip.props('disabled'))
    ).toBe(true)
    expect(wrapper.text()).toContain('Light level 70%')
    expect(wrapper.text()).toContain('Color temperature 3000 K')
    expect(wrapper.text()).toContain('Hue 20°')
    expect(wrapper.text()).toContain('Saturation 75%')

    const lightLevelSlider = wrapper
      .findAllComponents({ name: 'USlider' })
      .find(
        component =>
          component.vm.$attrs['aria-label'] === 'light device light level'
      )
    if (!lightLevelSlider) throw new Error('Unable to find light level slider')
    lightLevelSlider.vm.$emit('update:modelValue', 45)
    await flushPromises()

    expect(controlDevice).toHaveBeenCalledWith('light', 'DEVICE', {
      type: 'setLightLevel',
      lightLevel: 45,
    })

    await temperature.trigger('click')
    await flushPromises()
    expect(trigger.attributes('aria-expanded')).toBe('false')
    await temperature.trigger('click')
    await flushPromises()
    expect(trigger.attributes('aria-expanded')).toBe('true')
  })

  it('colors both light buttons by power state', async () => {
    const light = device('light', false)
    light.attributes.lightLevel = 70
    light.attributes.colorTemperature = 3000
    light.capabilities.canReceive = ['lightLevel', 'colorTemperature']
    const wrapper = await mountSuspended(DeviceItemCard, {
      props: { device: light, associations, scenesAvailable: false },
      global: { stubs: { UTooltip: TooltipStub } },
    })
    const buttons = () =>
      wrapper
        .findAllComponents({ name: 'UButton' })
        .filter(button =>
          String(button.attributes('aria-label')).startsWith('Adjust ')
        )
    expect(buttons()).toHaveLength(2)
    expect(buttons().map(button => button.props('color'))).toEqual([
      'secondary',
      'secondary',
    ])
    wrapper
      .findComponent({ name: 'UiSwitch' })
      .vm.$emit('update:modelValue', true)
    await wrapper.vm.$nextTick()
    expect(buttons().map(button => button.props('color'))).toEqual([
      'primary',
      'primary',
    ])
  })

  it('blocks opening while off and disables open sliders without closing them', async () => {
    const light = device('light', false)
    Object.assign(light.attributes, {
      lightLevel: 70,
      colorTemperature: 3000,
      colorHue: 20,
      colorSaturation: 0.75,
    })
    light.capabilities.canReceive = [
      'lightLevel',
      'colorTemperature',
      'colorHue',
      'colorSaturation',
    ]
    const wrapper = await mountSuspended(DeviceItemCard, {
      props: { device: light, associations, scenesAvailable: false },
      global: { stubs: { UTooltip: TooltipStub } },
    })
    const trigger = wrapper.get('[aria-label="Adjust light device brightness"]')
    const temperature = wrapper.get(
      '[aria-label="Adjust light device color temperature"]'
    )
    expect(trigger.attributes('disabled')).toBeDefined()
    expect(temperature.attributes('disabled')).toBeDefined()
    expect(
      wrapper
        .findAllComponents({ name: 'UTooltip' })
        .every(tooltip => tooltip.props('disabled'))
    ).toBe(true)
    await trigger.trigger('click')
    expect(trigger.attributes('aria-expanded')).toBe('false')

    const powerSwitch = wrapper.findComponent({ name: 'UiSwitch' })
    powerSwitch.vm.$emit('update:modelValue', true)
    await flushPromises()
    await trigger.trigger('click')
    await flushPromises()
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(wrapper.findAllComponents({ name: 'USlider' })).toHaveLength(4)

    powerSwitch.vm.$emit('update:modelValue', false)
    await flushPromises()
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('[data-slot="content"]').isVisible()).toBe(true)
    controlDevice.mockClear()
    for (const slider of wrapper.findAllComponents({ name: 'USlider' })) {
      expect(slider.props('disabled')).toBe(true)
      expect(slider.props('color')).toBe('secondary')
      slider.vm.$emit('update:modelValue', 30)
    }
    await flushPromises()
    expect(controlDevice).not.toHaveBeenCalled()

    powerSwitch.vm.$emit('update:modelValue', true)
    await flushPromises()
    expect(trigger.attributes('aria-expanded')).toBe('true')
    for (const slider of wrapper.findAllComponents({ name: 'USlider' })) {
      expect(slider.props('disabled')).toBe(false)
      expect(slider.props('color')).toBe('primary')
    }
  })

  it.each(['outlet', 'controller', 'sensor'] as const)(
    'hides light level for %s',
    async type => {
      const other = device(type, true)
      other.attributes.lightLevel = 84
      const wrapper = await mountSuspended(DeviceItemCard, {
        props: { device: other, associations, scenesAvailable: false },
      })
      expect(wrapper.text()).not.toContain('84%')
    }
  )

  it('does not show more controls for a light without adjustable capabilities', async () => {
    const wrapper = await mountSuspended(DeviceItemCard, {
      props: {
        device: device('light', true),
        associations,
        scenesAvailable: false,
      },
    })

    expect(wrapper.find('button[aria-expanded]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('more controls')
  })
})
