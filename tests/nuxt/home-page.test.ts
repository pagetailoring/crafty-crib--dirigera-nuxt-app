import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'

import HomePage from '../../app/pages/index.vue'

const { client } = vi.hoisted(() => ({
  client: {
    listScenes: vi.fn().mockResolvedValue([
      { id: 'all-off', name: 'All off' },
      { id: 'evening', name: 'Evening' },
    ]),
    listRooms: vi.fn().mockResolvedValue([
      {
        id: 'living-room',
        name: 'Living Room',
        temperature: 22.46,
        humidity: 44.8,
        pm25: 3,
        vocIndex: 98,
        co2: 612,
        quickControls: [
          { id: 'living-room-lights', type: 'LIGHTS', isOn: true },
        ],
      },
    ]),
    activateScene: vi.fn().mockResolvedValue(undefined),
    setQuickControl: vi.fn().mockResolvedValue(undefined),
  },
}))

mockNuxtImport('useDirigera', () => () => client)

describe('Home page', () => {
  it('shows scenes, rooms, and room readings', async () => {
    const wrapper = await mountSuspended(HomePage)

    expect(wrapper.text()).toContain('All off')
    expect(wrapper.text()).toContain('Evening')
    expect(wrapper.text()).toContain('Living Room')
    expect(wrapper.text()).toContain('22.5°C')
    expect(wrapper.text()).toContain('44.8%')
    expect(wrapper.text()).toContain('PM2.5 3')
    expect(wrapper.text()).toContain('VOC 98')
    expect(wrapper.text()).toContain('CO2 612')
    expect(wrapper.get('a[href="/devices"]').text()).toContain('Devices')
    expect(wrapper.get('a[href="/scenes"]').text()).toContain('Scenes')
  })

  it('activates a scene from its button', async () => {
    const wrapper = await mountSuspended(HomePage)

    await wrapper.get('button').trigger('click')

    expect(client.activateScene).toHaveBeenCalledWith('all-off')
  })

  it('toggles a room quick control', async () => {
    const wrapper = await mountSuspended(HomePage)

    await wrapper
      .get('[aria-label="Turn Living Room lights off"]')
      .trigger('click')

    expect(client.setQuickControl).toHaveBeenCalledWith(
      'living-room',
      'LIGHTS',
      false
    )
  })
})
