import { createPinia, setActivePinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  Device,
  DeviceCommand,
  Room,
} from '../../app/services/dirigera-client'
import { useDirigeraCacheStore } from '../../app/stores/cache'
import { DIRIGERA_CACHE_TTL_MS } from '../../config/dirigera-cache'

const { client } = vi.hoisted(() => ({
  client: {
    listRooms: vi.fn(),
    listScenes: vi.fn(),
    getRoom: vi.fn(),
    getPlayItemImage: vi.fn(),
    activateScene: vi.fn(),
    setQuickControl: vi.fn(),
    controlDevice: vi.fn(),
  },
}))

mockNuxtImport('useDirigera', () => () => client)

const room = (isOn = true): Room => ({
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
      isOn,
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
})

describe('Dirigera cache', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useRealTimers()
    vi.clearAllMocks()
    client.getRoom.mockResolvedValue(room())
    client.controlDevice.mockResolvedValue(undefined)
  })

  it('reuses a room until its configured TTL expires', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-13T10:00:00.000Z'))
    const cache = useDirigeraCacheStore()

    await cache.loadRoom('living-room')
    await cache.loadRoom('living-room')
    expect(client.getRoom).toHaveBeenCalledOnce()

    vi.advanceTimersByTime(DIRIGERA_CACHE_TTL_MS)
    await cache.loadRoom('living-room')
    expect(client.getRoom).toHaveBeenCalledTimes(2)
  })

  it('shares one request between concurrent room loads', async () => {
    const response = Promise.withResolvers<Room | null>()
    client.getRoom.mockReturnValueOnce(response.promise)
    const cache = useDirigeraCacheStore()

    const first = cache.loadRoom('living-room')
    const second = cache.loadRoom('living-room')

    expect(client.getRoom).toHaveBeenCalledOnce()
    response.resolve(room())
    await expect(Promise.all([first, second])).resolves.toEqual([
      room(),
      room(),
    ])
  })

  it('reloads an invalidated room', async () => {
    const cache = useDirigeraCacheStore()
    await cache.loadRoom('living-room')

    cache.invalidateAll()
    await cache.loadRoom('living-room')

    expect(client.getRoom).toHaveBeenCalledTimes(2)
  })

  const commandCases: { command: DeviceCommand; patch: Partial<Device> }[] = [
    { command: { type: 'setIsOn', isOn: false }, patch: { isOn: false } },
    {
      command: { type: 'setLightLevel', lightLevel: 45 },
      patch: { lightLevel: 45 },
    },
    {
      command: { type: 'setColorTemperature', colorTemperature: 2700 },
      patch: { colorTemperature: 2700 },
    },
    {
      command: { type: 'setColor', colorHue: 240, colorSaturation: 0.75 },
      patch: { colorHue: 240, colorSaturation: 0.75 },
    },
    {
      command: { type: 'setPlayback', playback: 'playbackPaused' },
      patch: { playback: 'playbackPaused' },
    },
    { command: { type: 'setVolume', volume: 25 }, patch: { volume: 25 } },
  ]

  it.each(commandCases)(
    'applies $command.type after success and replaces it with gateway state',
    async ({ command, patch }) => {
      const acknowledgement = Promise.withResolvers<undefined>()
      const verification = Promise.withResolvers<Room | null>()
      client.controlDevice.mockReturnValueOnce(acknowledgement.promise)
      client.getRoom
        .mockResolvedValueOnce(room())
        .mockReturnValueOnce(verification.promise)
      const cache = useDirigeraCacheStore()
      const loadedRoom = await cache.loadRoom('living-room')
      const device = loadedRoom!.devices[0]!
      const original = { ...device }

      const mutation = cache.controlDevice(device, command)
      expect(client.controlDevice).toHaveBeenCalledExactlyOnceWith(
        device.id,
        device.type,
        command
      )
      expect(cache.roomById['living-room']?.data.devices[0]).toEqual(original)
      expect(client.getRoom).toHaveBeenCalledOnce()

      acknowledgement.resolve(undefined)
      await vi.waitFor(() => {
        expect(client.getRoom).toHaveBeenCalledTimes(2)
      })
      expect(client.getRoom).toHaveBeenLastCalledWith('living-room')
      expect(cache.roomById['living-room']?.data.devices[0]).toEqual({
        ...original,
        ...patch,
      })

      verification.resolve(room())
      await mutation
      expect(cache.roomById['living-room']?.data.devices[0]).toEqual(original)
    }
  )

  it('keeps cached state unchanged when a device command fails', async () => {
    const cache = useDirigeraCacheStore()
    const loadedRoom = await cache.loadRoom('living-room')
    client.controlDevice.mockRejectedValueOnce(new Error('Command failed'))

    await expect(
      cache.controlDevice(loadedRoom!.devices[0]!, {
        type: 'setIsOn',
        isOn: false,
      })
    ).rejects.toThrow('Command failed')

    expect(cache.roomById['living-room']?.data).toEqual(room())
    expect(client.getRoom).toHaveBeenCalledOnce()
  })
})
