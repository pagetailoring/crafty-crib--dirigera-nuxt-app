import { describe, expect, it, vi } from 'vitest'
import type { Device, DirigeraClient, Home } from 'dirigera'
import { executeDirigeraQuery } from '../../server/services/dirigera-api'
import { createDirigeraClient } from '../../app/services/dirigera-client'
import { createDirigeraConnection } from '../../server/services/dirigera-connection'
import {
  createUpdateToken,
  verifyUpdateToken,
} from '../../server/utils/dirigera-session'

function fixture() {
  const device = (
    id: string,
    attributes: Record<string, unknown>,
    extra = {}
  ) =>
    ({
      id,
      type: 'light',
      deviceType: 'light',
      room: { id: 'room' },
      deviceSet: [],
      attributes: {
        customName: id,
        model: 'TRADFRI bulb',
        ...attributes,
      },
      capabilities: {
        canReceive: [
          'isOn',
          'lightLevel',
          'colorTemperature',
          'colorHue',
          'colorSaturation',
          'volume',
          'playback',
        ],
        canSend: [],
      },
      isReachable: true,
      lastSeen: '2026-10-13T10:00:00Z',
      ...extra,
    }) as unknown as Device
  const home = {
    rooms: [{ id: 'room', name: 'Room' }],
    scenes: [
      { id: 'scene', type: 'userScene', info: { name: 'Evening' } },
      { id: 'hidden', type: 'automation', info: { name: 'Hidden' } },
    ],
    devices: [
      device('light', { isOn: true, lightLevel: 75 }),
      device(
        'sensor',
        { currentTemperature: 20, currentRH: 40 },
        {
          type: 'environmentSensor',
          capabilities: { canReceive: [], canSend: [] },
        }
      ),
      device(
        'sensor2',
        { currentTemperature: 24, currentRH: 50 },
        {
          type: 'environmentSensor',
          capabilities: { canReceive: [], canSend: [] },
        }
      ),
      device(
        'group-light',
        { isOn: false },
        { deviceSet: [{ id: 'set', name: 'Set' }] }
      ),
      device(
        'speaker',
        { playback: 'playbackPlaying', volume: 20 },
        { type: 'speaker', deviceType: 'speaker' }
      ),
    ],
  } as unknown as Home
  const hub = {
    home: vi.fn().mockResolvedValue(home),
    devices: { setAttributes: vi.fn() },
    deviceSets: { setAttributes: vi.fn() },
    lights: { setIsOn: vi.fn() },
    outlets: { setIsOn: vi.fn() },
    speakers: { setPlayback: vi.fn() },
    scenes: { trigger: vi.fn() },
    startListeningForUpdates: vi.fn(),
    stopListeningForUpdates: vi.fn(),
  }
  const backend = hub as unknown as DirigeraClient
  const frontend = createDirigeraClient(
    async <T>(query: string, variables?: Record<string, unknown>) => {
      const result = await executeDirigeraQuery(backend, { query, variables })
      expect(result.errors).toBeUndefined()
      return result.data as T
    }
  )
  return { hub, backend, frontend }
}

describe('integrated Dirigera backend', () => {
  it('serves the unchanged frontend queries with room aggregates, groups and user scenes', async () => {
    const { frontend } = fixture()
    const rooms = await frontend.listRooms()
    expect(rooms[0]).toMatchObject({
      temperature: 22,
      humidity: 45,
      pm25: null,
    })
    expect(rooms[0]?.quickControls).toEqual([
      { id: 'room-lights', type: 'LIGHTS', isOn: true },
      { id: 'room-speakers', type: 'SPEAKERS', isOn: true },
    ])
    expect(await frontend.listScenes()).toEqual([
      { id: 'scene', name: 'Evening' },
    ])
    const room = await frontend.getRoom('room')
    expect(room?.devices.find(device => device.id === 'light')).toMatchObject({
      deviceType: 'light',
      productName: 'TRADFRI bulb',
    })
    expect(room?.devices.find(device => device.id === 'speaker')).toMatchObject(
      {
        deviceType: 'speaker',
        productName: 'TRADFRI bulb',
      }
    )
    expect(room?.devices.map(device => device.id)).toContain('set')
    expect(room?.devices.map(device => device.id)).not.toContain('group-light')
    expect(await frontend.getRoom('missing')).toBeNull()
    expect(await frontend.getPlayItemImage('missing')).toBeNull()
  })

  it('passes temperature limits through GraphQL and lists individual lights across groups and rooms', async () => {
    const { frontend, hub } = fixture()
    const home = await hub.home()
    home.devices[0]!.attributes.colorTemperature = 3000
    home.devices[0]!.attributes.colorTemperatureMin = 6500
    home.devices[0]!.attributes.colorTemperatureMax = 2000
    const grouped = home.devices.find(device => device.id === 'group-light')!
    grouped.attributes.colorTemperature = 3000
    grouped.attributes.colorTemperatureMin = 4000
    grouped.attributes.colorTemperatureMax = 2202
    grouped.room = undefined
    const room = await frontend.getRoom('room')
    expect(room?.devices.find(device => device.id === 'light')).toMatchObject({
      colorTemperatureMin: 6500,
      colorTemperatureMax: 2000,
    })
    const lights = await frontend.listTemperatureLights()
    expect(lights.map(light => light.id)).toEqual(['group-light', 'light'])
    expect(lights.find(light => light.id === 'group-light')).toMatchObject({
      type: 'DEVICE',
      colorTemperatureMin: 4000,
      colorTemperatureMax: 2202,
    })
  })

  it('limits a device set to the range supported by every member', async () => {
    const { frontend, hub } = fixture()
    const home = await hub.home()
    const member = home.devices.find(device => device.id === 'group-light')!
    Object.assign(member.attributes, {
      colorTemperature: 3000,
      colorTemperatureMin: 6500,
      colorTemperatureMax: 2000,
    })
    home.devices.push({
      ...member,
      id: 'second-member',
      attributes: {
        ...member.attributes,
        colorTemperatureMin: 4000,
        colorTemperatureMax: 2202,
      },
    })
    let room = await frontend.getRoom('room')
    expect(room?.devices.find(device => device.id === 'set')).toMatchObject({
      colorTemperatureMin: 2202,
      colorTemperatureMax: 4000,
    })
    home.devices.at(-1)!.capabilities = { canReceive: [], canSend: [] }
    room = await frontend.getRoom('room')
    expect(
      room?.devices.find(device => device.id === 'set')?.colorTemperature
    ).toBeNull()
  })

  it('routes every existing device command to the library and distinguishes device sets', async () => {
    const { frontend, hub } = fixture()
    await frontend.controlDevice('light', 'DEVICE', {
      type: 'setIsOn',
      isOn: false,
    })
    await frontend.controlDevice('light', 'DEVICE', {
      type: 'setLightLevel',
      lightLevel: 40,
    })
    await frontend.controlDevice('light', 'DEVICE', {
      type: 'setColorTemperature',
      colorTemperature: 3000,
    })
    await frontend.controlDevice('light', 'DEVICE', {
      type: 'setColor',
      colorHue: 120,
      colorSaturation: 0.5,
    })
    await frontend.controlDevice('speaker', 'DEVICE', {
      type: 'setPlayback',
      playback: 'playbackPaused',
    })
    await frontend.controlDevice('set', 'DEVICE_SET', {
      type: 'setVolume',
      volume: 35,
    })
    expect(hub.devices.setAttributes.mock.calls.map(call => call[0])).toEqual([
      { id: 'light', attributes: { isOn: false } },
      { id: 'light', attributes: { lightLevel: 40 } },
      { id: 'light', attributes: { colorTemperature: 3000 } },
      { id: 'light', attributes: { colorHue: 120, colorSaturation: 0.5 } },
      { id: 'speaker', attributes: { playback: 'playbackPaused' } },
    ])
    expect(hub.deviceSets.setAttributes).toHaveBeenCalledWith({
      id: 'set',
      attributes: { volume: 35 },
    })
    await frontend.activateScene('scene')
    expect(hub.scenes.trigger).toHaveBeenCalledWith({ id: 'scene' })
    await frontend.setQuickControl('room', 'LIGHTS', false)
    expect(hub.lights.setIsOn).toHaveBeenCalledTimes(2)
    await frontend.setQuickControl('room', 'SPEAKERS', false)
    expect(hub.speakers.setPlayback).toHaveBeenCalledWith({
      id: 'speaker',
      playback: 'playbackPaused',
    })
  })

  it('validates GraphQL before issuing commands and hides hub transport errors', async () => {
    const { backend, hub } = fixture()
    const invalid = await executeDirigeraQuery(backend, {
      query: 'mutation { setIsOn(id: "light", type: INVALID, isOn: true) }',
    })
    expect(invalid.errors).toHaveLength(1)
    expect(hub.devices.setAttributes).not.toHaveBeenCalled()
    hub.home.mockRejectedValue(new Error('private hub credential'))
    const failed = await executeDirigeraQuery(backend, {
      query: '{ rooms { id } }',
    })
    expect(failed.errors?.[0]?.message).toBe(
      'The Dirigera operation failed. Check the hub connection.'
    )
  })

  it('uses one home snapshot for multiple query fields', async () => {
    const { backend, hub } = fixture()
    await executeDirigeraQuery(backend, {
      query: '{ rooms { id } scenes { id } }',
    })
    expect(hub.home).toHaveBeenCalledOnce()
  })

  it('shares a hub connection, broadcasts updates, and releases it on shutdown', async () => {
    const { backend, hub } = fixture()
    const connect = vi.fn().mockResolvedValue(backend)
    const connection = createDirigeraConnection(connect)
    expect(connection.getStatus()).toEqual({ state: 'idle' })
    await Promise.all([connection.getClient(), connection.getClient()])
    expect(connection.getStatus()).toMatchObject({ state: 'ready' })
    expect(connect).toHaveBeenCalledOnce()
    expect(hub.home).toHaveBeenCalledOnce()
    expect(hub.startListeningForUpdates).toHaveBeenCalledOnce()
    const notify = vi.fn()
    const unsubscribe = connection.subscribe(notify)
    const update = hub.startListeningForUpdates.mock.calls[0]![0]
    update({ type: 'pong' })
    expect(notify).not.toHaveBeenCalled()
    update({ type: 'deviceStateChanged' })
    expect(notify).toHaveBeenCalledOnce()
    unsubscribe()
    update({ type: 'deviceStateChanged' })
    expect(notify).toHaveBeenCalledOnce()
    await connection.close()
    expect(hub.stopListeningForUpdates).toHaveBeenCalledOnce()
    await expect(connection.getClient()).rejects.toThrow('closed')
  })

  it('allows retry after failed initialization', async () => {
    const { backend } = fixture()
    const connect = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(backend)
    const connection = createDirigeraConnection(connect)
    await expect(connection.getClient()).rejects.toThrow('offline')
    expect(connection.getStatus()).toMatchObject({
      state: 'unavailable',
      reason: 'hub-unreachable',
    })
    await expect(connection.getClient()).resolves.toBe(backend)
    expect(connection.getStatus()).toMatchObject({ state: 'ready' })
    await connection.close()
  })

  it('allows retry after a failed hub probe', async () => {
    const { backend, hub } = fixture()
    hub.home.mockRejectedValueOnce(new Error('offline'))
    const connect = vi.fn().mockResolvedValue(backend)
    const connection = createDirigeraConnection(connect)

    await expect(connection.getClient()).rejects.toThrow('offline')
    expect(connection.getStatus()).toMatchObject({
      state: 'unavailable',
      reason: 'hub-unreachable',
    })
    expect(hub.startListeningForUpdates).not.toHaveBeenCalled()

    await expect(connection.getClient()).resolves.toBe(backend)
    expect(connect).toHaveBeenCalledTimes(2)
    expect(connection.getStatus()).toMatchObject({ state: 'ready' })
    await connection.close()
  })

  it('rejects forged and expired update tokens', () => {
    vi.useFakeTimers()
    try {
      const token = createUpdateToken()
      expect(verifyUpdateToken(token)).toBe(true)
      expect(verifyUpdateToken(`${token}x`)).toBe(false)
      expect(verifyUpdateToken(null)).toBe(false)
      vi.advanceTimersByTime(60_001)
      expect(verifyUpdateToken(token)).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })
})
