import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WhiteSpectrum from '../../app/pages/white-spectrum.vue'

const { client } = vi.hoisted(() => ({
  client: { listTemperatureLights: vi.fn(), controlDevice: vi.fn() },
}))
mockNuxtImport('useDirigera', () => () => client)

const lights = [
  {
    id: 'wide',
    name: 'Wide lamp',
    type: 'DEVICE',
    isReachable: true,
    colorTemperatureMin: 6500,
    colorTemperatureMax: 2000,
  },
  {
    id: 'narrow',
    name: 'Narrow lamp',
    type: 'DEVICE',
    isReachable: true,
    colorTemperatureMin: 4000,
    colorTemperatureMax: 2202,
  },
  { id: 'offline', name: 'Offline lamp', type: 'DEVICE', isReachable: false },
]

describe('White spectrum', () => {
  beforeEach(() => {
    client.listTemperatureLights.mockReset().mockResolvedValue(lights)
    client.controlDevice.mockReset().mockResolvedValue(undefined)
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
    expect(wrapper.text()).toContain('Updated 1 lights')
  })

  it('selects all reachable lights and clamps each target to its own range', async () => {
    const wrapper = await mountSuspended(WhiteSpectrum)
    await wrapper
      .findAll('button')
      .find(button => button.text().startsWith('Select all'))!
      .trigger('click')
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
    expect(wrapper.text()).toContain('Updated 2 lights')
  })

  it('reports partial failures and still applies to the other lights', async () => {
    client.controlDevice.mockImplementation(async (id: string) => {
      if (id === 'narrow') throw new Error('offline')
    })
    const wrapper = await mountSuspended(WhiteSpectrum)
    await wrapper
      .findAll('button')
      .find(button => button.text().startsWith('Select all'))!
      .trigger('click')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(client.controlDevice).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Updated 1 lights')
    expect(wrapper.text()).toContain('Failed: Narrow lamp')
  })

  it('does not send changes with an empty selection', async () => {
    const wrapper = await mountSuspended(WhiteSpectrum)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(client.controlDevice).not.toHaveBeenCalled()
  })

  it('shows load errors and allows retry', async () => {
    client.listTemperatureLights.mockRejectedValueOnce(new Error('offline'))
    const wrapper = await mountSuspended(WhiteSpectrum)
    expect(wrapper.text()).toContain('Unable to load lights')
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Refresh lights')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Wide lamp')
    expect(wrapper.text()).not.toContain('Unable to load lights')
  })
})
