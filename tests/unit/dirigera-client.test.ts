import { describe, expect, it, vi } from 'vitest'

import { createDirigeraClient } from '~/utils/dirigera-client'

describe('Dirigera client', () => {
  it('lists rooms with their environment readings and quick controls', async () => {
    const request = vi.fn().mockResolvedValue({
      rooms: [
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
      ],
    })

    const client = createDirigeraClient(request)

    await expect(client.listRooms()).resolves.toEqual([
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
    ])
    expect(request).toHaveBeenCalledOnce()
    expect(request).toHaveBeenCalledWith(expect.stringContaining('query Rooms'))
  })

  it('lists scenes', async () => {
    const request = vi.fn().mockResolvedValue({
      scenes: [
        { id: 'all-off', name: 'All off' },
        { id: 'evening', name: 'Evening' },
      ],
    })

    const client = createDirigeraClient(request)

    await expect(client.listScenes()).resolves.toEqual([
      { id: 'all-off', name: 'All off' },
      { id: 'evening', name: 'Evening' },
    ])
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('query Scenes')
    )
  })

  it('activates a scene', async () => {
    const request = vi.fn().mockResolvedValue({ activateScene: null })
    const client = createDirigeraClient(request)

    await client.activateScene('evening')

    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('mutation ActivateScene'),
      { id: 'evening' }
    )
  })

  it('loads a room with its devices', async () => {
    const room = {
      id: 'living-room',
      name: 'Living Room',
      devices: [
        {
          id: 'lamp',
          name: 'Lamp',
          type: 'DEVICE',
          deviceType: 'light',
          productName: 'TRADFRI bulb',
          isReachable: true,
          lastSeen: '2026-10-13T01:00:00.000Z',
          batteryPercentage: null,
          isOn: true,
          lightLevel: 70,
          colorTemperature: 3000,
          colorSaturation: 0.5,
          colorHue: 120,
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
        },
      ],
    }
    const request = vi.fn().mockResolvedValue({ room })
    const client = createDirigeraClient(request)

    await expect(client.getRoom('living-room')).resolves.toEqual(room)
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('query Room'),
      {
        id: 'living-room',
      }
    )
  })

  it('changes a room quick control', async () => {
    const request = vi.fn().mockResolvedValue({ quickControl: null })
    const client = createDirigeraClient(request)

    await client.setQuickControl('living-room', 'LIGHTS', false)

    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('mutation QuickControl'),
      { roomId: 'living-room', type: 'LIGHTS', isOn: false }
    )
  })

  it('switches a device on or off', async () => {
    const request = vi.fn().mockResolvedValue({ setIsOn: true })
    const client = createDirigeraClient(request)

    await client.controlDevice('lamp', 'DEVICE', {
      type: 'setIsOn',
      isOn: false,
    })

    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('mutation SetIsOn'),
      { id: 'lamp', type: 'DEVICE', isOn: false }
    )
  })

  it('changes a device light level', async () => {
    const request = vi.fn().mockResolvedValue({ setLightLevel: true })
    const client = createDirigeraClient(request)

    await client.controlDevice('lamp', 'DEVICE_SET', {
      type: 'setLightLevel',
      lightLevel: 45,
    })

    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('mutation SetLightLevel'),
      { id: 'lamp', type: 'DEVICE_SET', lightLevel: 45 }
    )
  })

  it('changes a device color temperature', async () => {
    const request = vi.fn().mockResolvedValue({ setColorTemperature: true })
    const client = createDirigeraClient(request)

    await client.controlDevice('lamp', 'DEVICE', {
      type: 'setColorTemperature',
      colorTemperature: 3000,
    })

    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('mutation SetColorTemperature'),
      { id: 'lamp', type: 'DEVICE', colorTemperature: 3000 }
    )
  })

  it('changes a device hue and saturation together', async () => {
    const request = vi
      .fn()
      .mockResolvedValue({ setColorHueAndSaturation: true })
    const client = createDirigeraClient(request)

    await client.controlDevice('lamp', 'DEVICE', {
      type: 'setColor',
      colorHue: 120,
      colorSaturation: 0.75,
    })

    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('mutation SetColorHueAndSaturation'),
      {
        id: 'lamp',
        type: 'DEVICE',
        colorHue: 120,
        colorSaturation: 0.75,
      }
    )
  })

  it('changes device playback', async () => {
    const request = vi.fn().mockResolvedValue({ setPlayback: true })
    const client = createDirigeraClient(request)

    await client.controlDevice('speaker', 'DEVICE', {
      type: 'setPlayback',
      playback: 'playbackNext',
    })

    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('mutation SetPlayback'),
      { id: 'speaker', type: 'DEVICE', playback: 'playbackNext' }
    )
  })

  it('changes device volume', async () => {
    const request = vi.fn().mockResolvedValue({ setVolume: true })
    const client = createDirigeraClient(request)

    await client.controlDevice('speaker', 'DEVICE', {
      type: 'setVolume',
      volume: 25,
    })

    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('mutation SetVolume'),
      { id: 'speaker', type: 'DEVICE', volume: 25 }
    )
  })

  it('loads the current play item image', async () => {
    const request = vi.fn().mockResolvedValue({
      devicePlayItemImageURL: 'data:image/png;base64,image',
    })
    const client = createDirigeraClient(request)

    await expect(client.getPlayItemImage('speaker')).resolves.toBe(
      'data:image/png;base64,image'
    )
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('query DevicePlayItemImage'),
      { id: 'speaker' }
    )
  })
})
