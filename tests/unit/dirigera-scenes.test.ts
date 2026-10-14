import type { DirigeraClient, Scene } from 'dirigera'
import { describe, expect, it, vi } from 'vitest'
import {
  listSceneDetails,
  listSceneProducts,
  updateScene,
} from '../../server/services/dirigera-scenes'

describe('Dirigera scene details', () => {
  it('returns every scene with its complete hub representation', async () => {
    const scenes = [
      {
        id: 'evening',
        info: { name: 'Evening', icon: 'scenes_moon' },
        type: 'userScene',
        triggers: [{ type: 'app' }],
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
      },
    ] as Scene[]
    const client = {
      scenes: { list: vi.fn().mockResolvedValue(scenes) },
    } as unknown as DirigeraClient

    await expect(listSceneDetails(client)).resolves.toBe(scenes)
    expect(client.scenes.list).toHaveBeenCalledOnce()
  })

  it('resolves product names and power support from the hub', async () => {
    const client = {
      home: vi.fn().mockResolvedValue({
        devices: [
          {
            id: 'light',
            attributes: { customName: 'Bedside lamp', model: 'TRADFRI' },
            room: { name: 'Bedroom' },
            deviceSet: [{ id: 'set' }],
            capabilities: { canReceive: ['isOn'] },
          },
        ],
        deviceSets: [{ id: 'set', name: 'Bedroom lights' }],
      }),
    } as unknown as DirigeraClient

    await expect(listSceneProducts(client)).resolves.toEqual([
      {
        id: 'set',
        type: 'deviceSet',
        name: 'Bedroom lights',
        productName: null,
        roomName: null,
        canSetPower: true,
      },
      {
        id: 'light',
        type: 'device',
        name: 'Bedside lamp',
        productName: 'TRADFRI',
        roomName: 'Bedroom',
        canSetPower: true,
      },
    ])
  })

  it('saves only requested action and weekday changes while preserving scene data', async () => {
    const scene = {
      id: 'evening',
      info: { name: 'Evening', icon: 'scenes_moon' },
      type: 'userScene',
      triggers: [
        { id: 'schedule', type: 'time', trigger: { time: '18:00' } },
        { id: 'app', type: 'app' },
      ],
      actions: [
        {
          id: 'action',
          type: 'device',
          deviceId: 'light',
          attributes: { isOn: true, lightLevel: 40 },
        },
      ],
      commands: [],
    } as unknown as Scene
    const client = {
      home: vi.fn().mockResolvedValue({ devices: [], deviceSets: [] }),
      scenes: {
        get: vi.fn().mockResolvedValue(scene),
        update: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as DirigeraClient

    await updateScene(client, scene.id, {
      expectedActions: scene.actions,
      expectedTriggers: scene.triggers,
      actions: [{ kind: 'existing', index: 0, isOn: false }],
      days: [{ index: 0, days: ['Mon', 'Wed'] }],
    })

    expect(client.scenes.update).toHaveBeenCalledWith({
      id: 'evening',
      info: scene.info,
      type: 'userScene',
      actions: [
        {
          id: 'action',
          type: 'device',
          deviceId: 'light',
          attributes: { isOn: false, lightLevel: 40 },
        },
      ],
      triggers: [
        {
          id: 'schedule',
          type: 'time',
          trigger: { time: '18:00', days: ['Mon', 'Wed'] },
        },
        { id: 'app', type: 'app' },
      ],
    })
    expect(scene.actions[0]?.attributes.isOn).toBe(true)
    expect(scene.triggers?.[0]).toEqual({
      id: 'schedule',
      type: 'time',
      trigger: { time: '18:00' },
    })
  })

  it('rejects a stale edit before writing to the hub', async () => {
    const scene = {
      id: 'evening',
      info: { name: 'Evening', icon: 'scenes_moon' },
      type: 'userScene',
      actions: [],
      commands: [],
    } as unknown as Scene
    const client = {
      scenes: {
        get: vi.fn().mockResolvedValue(scene),
        update: vi.fn(),
      },
    } as unknown as DirigeraClient

    await expect(
      updateScene(client, scene.id, {
        expectedActions: [{ type: 'device', attributes: {} }],
        expectedTriggers: undefined,
        actions: [],
        days: [],
      })
    ).rejects.toMatchObject({ statusCode: 409 })
    expect(client.scenes.update).not.toHaveBeenCalled()
  })

  it('adds a power-capable product with the chosen off state', async () => {
    const scene = {
      id: 'evening',
      info: { name: 'Evening', icon: 'scenes_moon' },
      type: 'userScene',
      actions: [],
      triggers: [{ type: 'app' }],
      commands: [],
    } as unknown as Scene
    const client = {
      home: vi.fn().mockResolvedValue({
        devices: [
          {
            id: 'plug',
            attributes: { customName: 'Fan plug', model: 'INSPELNING' },
            deviceSet: [],
            capabilities: { canReceive: ['isOn'] },
          },
        ],
        deviceSets: [],
      }),
      scenes: {
        get: vi.fn().mockResolvedValue(scene),
        update: vi.fn(),
      },
    } as unknown as DirigeraClient

    await updateScene(client, scene.id, {
      expectedActions: [],
      expectedTriggers: scene.triggers,
      actions: [{ kind: 'new', type: 'device', deviceId: 'plug', isOn: false }],
      days: [],
    })

    expect(client.scenes.update).toHaveBeenCalledWith({
      id: 'evening',
      info: scene.info,
      type: scene.type,
      triggers: scene.triggers,
      actions: [
        {
          type: 'device',
          deviceId: 'plug',
          enabled: true,
          attributes: { isOn: false },
        },
      ],
    })
  })
})
