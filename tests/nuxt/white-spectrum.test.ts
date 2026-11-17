import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WhiteSpectrum from '~/pages/white-spectrum.vue'

const { client, toast } = vi.hoisted(() => ({
  client: { listTemperatureLights: vi.fn(), controlDevice: vi.fn() },
  toast: { add: vi.fn() },
}))
mockNuxtImport('useDirigera', () => () => client)
mockNuxtImport('useToast', () => () => toast)

const lights = [
  {
    id: 'wide',
    name: 'Wide lamp',
    type: 'DEVICE',
    isReachable: true,
    productName: 'Wide bulb',
    roomName: 'Living Room',
    isOn: true,
    lightLevel: 72,
    colorTemperature: 3200,
    colorTemperatureMin: 6500,
    colorTemperatureMax: 2000,
  },
  {
    id: 'narrow',
    name: 'Narrow lamp',
    type: 'DEVICE',
    isReachable: true,
    productName: 'Narrow bulb',
    roomName: 'Bedroom',
    isOn: false,
    lightLevel: null,
    colorTemperature: 2700,
    colorTemperatureMin: 4000,
    colorTemperatureMax: 2202,
  },
  { id: 'offline', name: 'Offline lamp', type: 'DEVICE', isReachable: false },
]

describe('White spectrum', () => {
  beforeEach(() => {
    client.listTemperatureLights
      .mockReset()
      .mockResolvedValue(structuredClone(lights))
    client.controlDevice.mockReset().mockResolvedValue(undefined)
    toast.add.mockReset()
  })

  it('selects every reachable light by default', async () => {
    const wrapper = await mountSuspended(WhiteSpectrum)

    expect(
      wrapper.findComponent({ name: 'UCheckboxGroup' }).props('modelValue')
    ).toEqual(['wide', 'narrow'])
    expect(wrapper.get('[aria-label="Apply white spectrum"]').text()).toContain(
      'Apply color temperature'
    )
    const applyButton = wrapper
      .findAllComponents({ name: 'UButton' })
      .find(
        button => button.attributes('aria-label') === 'Apply white spectrum'
      )
    expect(applyButton?.props('color')).toBe('primary')
    expect(wrapper.get('[aria-label="Select all lights"]').text()).toContain(
      'Select available'
    )
    const temperatureCard = wrapper.findComponent({ name: 'UCard' })
    expect(temperatureCard.classes()).toContain('max-w-200')
    expect(temperatureCard.text()).toContain('Color temperature')
    expect(temperatureCard.text()).toContain('3200 K')
    expect(
      temperatureCard
        .find('[data-slot="footer"] [aria-label="Apply white spectrum"]')
        .exists()
    ).toBeTruthy()
    const temperatureBadge = temperatureCard
      .findAllComponents({ name: 'UBadge' })
      .find(badge => badge.props('label') === '3200 K')
    expect(temperatureBadge?.props('size')).toBe('lg')
    expect(temperatureBadge?.classes()).toContain('tabular-nums')
    expect(wrapper.findComponent({ name: 'USlider' }).props('color')).toBe(
      'secondary'
    )
    expect(wrapper.findComponent({ name: 'USlider' }).props('modelValue')).toBe(
      3200
    )
    expect(wrapper.text()).toContain('Living Room')
    expect(wrapper.text()).toContain('3200 K')
    expect(wrapper.text()).toContain('72%')
  })

  it('explains why applying is disabled when no light is selected', async () => {
    const wrapper = await mountSuspended(WhiteSpectrum)
    wrapper
      .findComponent({ name: 'UCheckboxGroup' })
      .vm.$emit('update:modelValue', [])
    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAllComponents({ name: 'UButton' })
    const applyButton = buttons.find(
      button => button.attributes('aria-label') === 'Apply white spectrum'
    )
    const clearButton = buttons.find(
      button => button.attributes('aria-label') === 'Clear all lights'
    )

    expect(applyButton?.props()).toMatchObject({
      color: 'neutral',
      disabled: true,
      label: 'Select at least one light',
    })
    expect(clearButton?.props('variant')).toBeUndefined()
  })

  it('keeps unselected cards neutral regardless of their power state', async () => {
    const wrapper = await mountSuspended(WhiteSpectrum)
    const checkboxGroup = wrapper.findComponent({ name: 'UCheckboxGroup' })
    checkboxGroup.vm.$emit('update:modelValue', [])
    await wrapper.vm.$nextTick()

    const items = checkboxGroup.props('items') as Array<{
      class?: string
      light: { isOn?: boolean }
    }>
    const poweredOnItem = items.find(item => item.light.isOn)
    const poweredOffItem = items.find(item => item.light.isOn === false)

    expect(poweredOnItem?.class).toBe('!border-default !bg-transparent !z-auto')
    expect(poweredOffItem?.class).toBe(
      '!border-default !bg-transparent !z-auto'
    )
  })

  it('uses the rounded average temperature of reachable lights that are on', async () => {
    client.listTemperatureLights.mockResolvedValueOnce([
      structuredClone(lights[0]),
      {
        ...structuredClone(lights[1]),
        isOn: true,
        colorTemperature: 2801,
      },
      { ...structuredClone(lights[2]), isOn: true, colorTemperature: 6000 },
    ])

    const wrapper = await mountSuspended(WhiteSpectrum)

    expect(wrapper.findComponent({ name: 'USlider' }).props('modelValue')).toBe(
      3001
    )
  })

  it('turns a light off without changing the selected cards and dims its brightness badge', async () => {
    const wrapper = await mountSuspended(WhiteSpectrum)
    const switchControl = wrapper.get('[aria-label="Turn Wide lamp off"]')
    const brightnessBadge = wrapper
      .findAllComponents({ name: 'UBadge' })
      .find(badge => badge.text().includes('72%'))

    expect(brightnessBadge?.props('variant')).toBe('subtle')
    expect(brightnessBadge?.classes()).not.toContain('opacity-75')

    await switchControl.trigger('click')
    await flushPromises()

    expect(client.controlDevice).toHaveBeenCalledWith('wide', 'DEVICE', {
      type: 'setIsOn',
      isOn: false,
    })
    expect(
      wrapper.findComponent({ name: 'UCheckboxGroup' }).props('modelValue')
    ).toEqual(['wide', 'narrow'])
    expect(brightnessBadge?.props('variant')).toBe('soft')
    expect(brightnessBadge?.classes()).toContain('opacity-75')
  })

  it('applies to selected lights only', async () => {
    const wrapper = await mountSuspended(WhiteSpectrum)
    wrapper
      .findComponent({ name: 'UCheckboxGroup' })
      .vm.$emit('update:modelValue', ['wide'])
    await wrapper.vm.$nextTick()
    wrapper
      .findComponent({ name: 'USlider' })
      .vm.$emit('update:modelValue', 6500)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(client.controlDevice).toHaveBeenCalledExactlyOnceWith(
      'wide',
      'DEVICE',
      { type: 'setColorTemperature', colorTemperature: 6500 }
    )
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Updated 1 lights', color: 'success' })
    )
  })

  it('selects all reachable lights and clamps each target to its own range', async () => {
    const wrapper = await mountSuspended(WhiteSpectrum)
    await wrapper.get('[aria-label="Select all lights"]').trigger('click')
    wrapper
      .findComponent({ name: 'USlider' })
      .vm.$emit('update:modelValue', 6500)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(client.controlDevice).toHaveBeenCalledTimes(2)
    expect(client.controlDevice).toHaveBeenCalledWith('wide', 'DEVICE', {
      type: 'setColorTemperature',
      colorTemperature: 6500,
    })
    expect(client.controlDevice).toHaveBeenCalledWith('narrow', 'DEVICE', {
      type: 'setColorTemperature',
      colorTemperature: 4000,
    })
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Updated 2 lights', color: 'success' })
    )
  })

  it('reports partial failures and still applies to the other lights', async () => {
    client.controlDevice.mockImplementation(async (id: string) => {
      if (id === 'narrow') throw new Error('offline')
    })
    const wrapper = await mountSuspended(WhiteSpectrum)
    await wrapper.get('[aria-label="Select all lights"]').trigger('click')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(client.controlDevice).toHaveBeenCalledTimes(2)
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated 1 lights',
        description: 'Failed: Narrow lamp. You can retry these lights.',
        color: 'error',
      })
    )
  })

  it('does not send changes with an empty selection', async () => {
    const wrapper = await mountSuspended(WhiteSpectrum)
    wrapper
      .findComponent({ name: 'UCheckboxGroup' })
      .vm.$emit('update:modelValue', [])
    await wrapper.vm.$nextTick()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(client.controlDevice).not.toHaveBeenCalled()
  })

  it('shows load errors and allows retry', async () => {
    client.listTemperatureLights.mockRejectedValueOnce(new Error('offline'))
    const wrapper = await mountSuspended(WhiteSpectrum)
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Unable to load lights',
        color: 'error',
      })
    )
    await wrapper.get('[aria-label="Refresh lights"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Wide lamp')
    expect(
      wrapper.findComponent({ name: 'UCheckboxGroup' }).props('modelValue')
    ).toEqual(['wide', 'narrow'])
  })
})
