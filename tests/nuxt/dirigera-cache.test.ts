import { createPinia, setActivePinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Room } from '../../app/services/dirigera-client'
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

  it('updates cached device state before verifying it with the gateway', async () => {
    const verification = Promise.withResolvers<Room | null>()
    client.getRoom
      .mockResolvedValueOnce(room())
      .mockReturnValueOnce(verification.promise)
    const cache = useDirigeraCacheStore()
    const loadedRoom = await cache.loadRoom('living-room')

    const mutation = cache.controlDevice(loadedRoom!.devices[0]!, {
      type: 'setIsOn',
      isOn: false,
    })
    await vi.waitFor(() => {
      expect(cache.roomById['living-room']?.data.devices[0]?.isOn).toBe(false)
    })

    verification.resolve(room(false))
    await mutation
    expect(client.getRoom).toHaveBeenCalledTimes(2)
    expect(cache.roomById['living-room']?.data.devices[0]?.isOn).toBe(false)
  })
})
