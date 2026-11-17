import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ScenesPage from '~/pages/scenes/index.vue'
import ScenePage from '~/pages/scenes/[id].vue'
import DebugPage from '~/pages/scenes/debug.vue'

const { sceneDetails, dirigera, scene } = vi.hoisted(() => {
  const scene = {
    id: 'evening',
    info: { name: 'Evening', icon: 'scenes_moon' },
    type: 'userScene',
    triggers: [{ id: 'schedule', type: 'time', trigger: { time: '18:00' } }],
    actions: [
      {
        id: 'action',
        type: 'device',
        deviceId: 'light',
        attributes: { isOn: true, lightLevel: 40 },
      },
    ],
    commands: [],
    createdAt: '2026-10-14T10:00:00.000Z',
    undoAllowedDuration: 0,
  }
  return {
    scene,
    sceneDetails: {
      listScenes: vi.fn(),
      listProducts: vi.fn(),
      updateScene: vi.fn(),
    },
    dirigera: { activateScene: vi.fn() },
  }
})

mockNuxtImport('useSceneDetails', () => () => sceneDetails)
mockNuxtImport('useDirigera', () => () => dirigera)

describe('Scenes page', () => {
  beforeEach(() => {
    sceneDetails.listScenes.mockReset().mockResolvedValue([scene])
    sceneDetails.listProducts.mockReset().mockResolvedValue([
      {
        id: 'light',
        type: 'device',
        name: 'Bedside lamp',
        productName: 'TRADFRI bulb',
        roomName: 'Bedroom',
        canSetPower: true,
        capabilities: ['isOn', 'lightLevel', 'colorTemperature'],
        groups: [],
        members: [],
        isReachable: true,
        colorTemperatureMin: 2500,
        colorTemperatureMax: 4000,
        temperatureRangeReported: true,
        playbackOptions: [],
      },
      {
        id: 'plug',
        type: 'device',
        name: 'Fan plug',
        productName: 'INSPELNING',
        roomName: 'Bedroom',
        canSetPower: true,
        capabilities: ['isOn'],
        groups: [],
        members: [],
        isReachable: true,
        colorTemperatureMin: null,
        colorTemperatureMax: null,
        temperatureRangeReported: false,
        playbackOptions: [],
      },
    ])
    sceneDetails.updateScene.mockReset().mockResolvedValue(scene)
    dirigera.activateScene.mockReset().mockResolvedValue(undefined)
  })

  it('shows product names, scene effects, and the schedule', async () => {
    const wrapper = await mountSuspended(ScenesPage, { route: '/scenes' })

    expect(wrapper.text()).toContain('Evening')
    expect(wrapper.text()).toContain('Bedside lamp')
    expect(wrapper.text()).toContain('TRADFRI bulb')
    expect(wrapper.text()).toContain('Turns on')
    expect(wrapper.text()).toContain('Brightness 40%')
    expect(wrapper.text()).toContain('At 18:00')
    expect(wrapper.text()).toContain('Mon')
    expect(wrapper.get('a[href="/scenes/debug"]').text()).toContain(
      'Debug view'
    )
    expect(wrapper.get('a[href="/scenes/evening"]').text()).toContain('Details')
  })

  it('opens one scene directly with the same editing and activation actions', async () => {
    const wrapper = await mountSuspended(ScenePage, {
      route: '/scenes/evening',
    })

    expect(wrapper.text()).toContain('Bedside lamp')
    expect(wrapper.text()).toContain('At 18:00')
    expect(wrapper.get('a[href="/scenes"]').text()).toContain('All scenes')
    await wrapper.get('[aria-label="Test Evening"]').trigger('click')
    expect(dirigera.activateScene).toHaveBeenCalledWith('evening')

    await wrapper.get('[aria-label="Edit Evening"]').trigger('click')
    await wrapper.get('[aria-label="Save changes to Evening"]').trigger('click')
    expect(sceneDetails.updateScene).toHaveBeenCalledWith(
      'evening',
      expect.any(Object)
    )
  })

  it('shows a missing-scene message for an unknown direct link', async () => {
    const wrapper = await mountSuspended(ScenePage, {
      route: '/scenes/missing',
    })

    expect(wrapper.text()).toContain('Scene not found')
    expect(wrapper.findComponent({ name: 'ScenesSceneCard' }).exists()).toBe(
      false
    )
  })

  it('saves a removed product and changed weekdays', async () => {
    const wrapper = await mountSuspended(ScenesPage, { route: '/scenes' })
    await wrapper.get('[aria-label="Edit Evening"]').trigger('click')
    await wrapper
      .get('[aria-label="Edit settings for Bedside lamp"]')
      .trigger('click')
    await wrapper
      .get('[aria-label="Remove Bedside lamp from scene"]')
      .trigger('click')
    await wrapper.get('[aria-label="Sun for schedule 1"]').trigger('click')
    await wrapper.get('[aria-label="Save changes to Evening"]').trigger('click')

    expect(sceneDetails.updateScene).toHaveBeenCalledWith(
      'evening',
      expect.objectContaining({
        actions: [],
        days: [{ index: 0, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }],
      })
    )
  })

  it('adds a product with its selected power state', async () => {
    const wrapper = await mountSuspended(ScenesPage, { route: '/scenes' })
    await wrapper.get('[aria-label="Edit Evening"]').trigger('click')
    const select = wrapper
      .findAllComponents({ name: 'USelect' })
      .find(component =>
        component
          .props('items')
          .some((item: { value: string }) => item.value === 'device:plug')
      )!
    select.vm.$emit('update:modelValue', 'device:plug')
    await flushPromises()
    await wrapper.get('[aria-label="Power for new product"]').trigger('click')
    await wrapper
      .get('[aria-label="Add selected product to scene"]')
      .trigger('click')
    await wrapper.get('[aria-label="Save changes to Evening"]').trigger('click')

    expect(sceneDetails.updateScene).toHaveBeenCalledWith(
      'evening',
      expect.objectContaining({
        actions: [
          { kind: 'existing', index: 0, attributes: {} },
          {
            kind: 'new',
            type: 'device',
            deviceId: 'plug',
            attributes: { isOn: false },
          },
        ],
      })
    )
  })

  it('edits white temperature with product limits without activating the scene', async () => {
    const wrapper = await mountSuspended(ScenesPage, { route: '/scenes' })
    await wrapper.get('[aria-label="Edit Evening"]').trigger('click')
    await wrapper
      .get('[aria-label="Edit settings for Bedside lamp"]')
      .trigger('click')
    expect(wrapper.text()).toContain('2500–4000 K')
    expect(wrapper.text()).toContain('Bedroom')
    await wrapper
      .get('[aria-label="Set color temperature for Bedside lamp"]')
      .trigger('click')
    const slider = wrapper
      .findAllComponents({ name: 'USlider' })
      .find(component => component.props('min') === 2500)!
    expect(slider.props('min')).toBe(2500)
    expect(slider.props('max')).toBe(4000)
    slider.vm.$emit('update:modelValue', 3200)
    await flushPromises()
    await wrapper.get('[aria-label="Save changes to Evening"]').trigger('click')
    expect(sceneDetails.updateScene).toHaveBeenCalledWith(
      'evening',
      expect.objectContaining({
        actions: [
          {
            kind: 'existing',
            index: 0,
            attributes: {
              colorTemperature: 3200,
              colorHue: null,
              colorSaturation: null,
            },
          },
        ],
      })
    )
    expect(dirigera.activateScene).not.toHaveBeenCalled()
  })

  it('keeps the original full-detail page available for debugging', async () => {
    const wrapper = await mountSuspended(DebugPage, {
      route: '/scenes/debug',
    })

    expect(wrapper.text()).toContain('scenes_moon')
    expect(wrapper.text()).toContain('Triggers (1)')
    expect(wrapper.text()).toContain('Actions (1)')
    expect(wrapper.text()).toContain('lightLevel')
  })

  it('tests a scene from the card', async () => {
    const wrapper = await mountSuspended(ScenesPage, { route: '/scenes' })
    await wrapper.get('[aria-label="Test Evening"]').trigger('click')

    expect(dirigera.activateScene).toHaveBeenCalledWith('evening')
  })
})
