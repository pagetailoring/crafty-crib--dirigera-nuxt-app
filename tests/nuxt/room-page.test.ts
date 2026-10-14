import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'

import RoomPage from '../../app/pages/room/[id].vue'

const { client } = vi.hoisted(() => ({
  client: {
    getRoom: vi.fn().mockResolvedValue({
      id: 'living-room',
      name: 'Living Room',
      devices: [
        {
          id: 'sensor',
          name: 'Environment sensor',
          type: 'DEVICE',
          isReachable: false,
          lastSeen: '2026-10-13T01:00:00.000Z',
          batteryPercentage: 92,
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
          temperature: 22.456,
          humidity: 44.812,
          pm25: 3,
          vocIndex: 98,
          co2: 612,
          isOpen: true,
          isDetected: false,
          illuminance: 120,
        },
      ],
    }),
  },
}))

mockNuxtImport('useDirigera', () => () => client)

describe('Room page', () => {
  it('shows devices, availability, battery, and sensor values', async () => {
    const wrapper = await mountSuspended(RoomPage, {
      route: '/room/living-room',
    })

    expect(client.getRoom).toHaveBeenCalledWith('living-room')
    expect(wrapper.get('h1').classes()).toContain('sr-only')
    expect(wrapper.text()).toContain('Living Room')
    expect(wrapper.text()).toContain('Environment sensor')
    expect(wrapper.text()).toContain('Unreachable')
    expect(wrapper.text()).toContain(
      new Date('2026-10-13T01:00:00.000Z').toLocaleString()
    )
    expect(wrapper.text()).toContain('Battery 92%')
    expect(wrapper.text()).toContain('Open')
    expect(wrapper.text()).toContain('Temperature 22.46°C')
    expect(wrapper.text()).toContain('Humidity 44.81%')
    expect(wrapper.text()).toContain('PM2.5 3 μg/m³')
    expect(wrapper.text()).toContain('VOC index 98')
    expect(wrapper.text()).toContain('CO2 612 ppm')
    expect(wrapper.text()).toContain('Motion detected no')
    expect(wrapper.text()).toContain('Illuminance 120 lx')
  })
})
