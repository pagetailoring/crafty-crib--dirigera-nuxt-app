import type { DirigeraClient, Scene } from 'dirigera'
import { describe, expect, it, vi } from 'vitest'
import {
  isSceneUpdateInput,
  listSceneDetails,
  listSceneProducts,
  updateScene,
} from '@@/server/utils/dirigera-scenes'

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

    await expect(listSceneProducts(client)).resolves.toMatchObject([
      {
        id: 'set',
        type: 'deviceSet',
        name: 'Bedroom lights',
        productName: 'TRADFRI',
        roomName: 'Bedroom',
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
      home: vi.fn().mockResolvedValue({
        devices: [
          {
            id: 'light',
            attributes: { customName: 'Lamp' },
            deviceSet: [],
            capabilities: {
              canReceive: ['isOn', 'lightLevel', 'colorTemperature'],
            },
          },
        ],
        deviceSets: [],
      }),
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

function editableFixture() {
  const scene = {
    id: 'scene',
    info: { name: 'Evening', icon: 'scenes_moon' },
    type: 'userScene',
    commands: [],
    triggers: [{ type: 'app' }],
    actions: [
      {
        id: 'action',
        type: 'device',
        deviceId: 'lamp',
        enabled: false,
        attributes: {
          isOn: true,
          lightLevel: 40,
          colorTemperature: 2700,
          customName: 'Preserve me',
        },
      },
    ],
  } as Scene
  const home = {
    devices: [
      {
        id: 'lamp',
        attributes: {
          customName: 'Lamp',
          model: 'TRADFRI',
          colorTemperatureMin: 2500,
          colorTemperatureMax: 4000,
        },
        room: { name: 'Bedroom' },
        deviceSet: [{ id: 'group', name: 'Pair' }],
        isReachable: true,
        capabilities: {
          canReceive: [
            'isOn',
            'lightLevel',
            'colorTemperature',
            'colorHue',
            'colorSaturation',
          ],
        },
      },
      {
        id: 'lamp2',
        attributes: {
          customName: 'Second lamp',
          model: 'KAJPLATS',
          colorTemperatureMin: 2700,
          colorTemperatureMax: 6500,
        },
        room: { name: 'Bedroom' },
        deviceSet: [{ id: 'group', name: 'Pair' }],
        isReachable: true,
        capabilities: {
          canReceive: ['isOn', 'lightLevel', 'colorTemperature'],
        },
      },
      {
        id: 'speaker',
        attributes: {
          customName: 'Speaker',
          playbackAvailableActions: { pause: true },
        },
        deviceSet: [],
        isReachable: true,
        capabilities: { canReceive: ['volume', 'playback'] },
      },
    ],
    deviceSets: [{ id: 'group', name: 'Pair' }],
  }
  const update = vi.fn()
  const client = {
    home: vi.fn().mockResolvedValue(home),
    scenes: { get: vi.fn().mockResolvedValue(scene), update },
  } as unknown as DirigeraClient
  const input = {
    expectedActions: scene.actions,
    expectedTriggers: scene.triggers,
    actions: [],
    days: [],
  }
  return { scene, home, client, input, update }
}

describe('capability-aware scene editing', () => {
  it('reports product membership and the intersection of group capabilities and ranges', async () => {
    const { client } = editableFixture()
    const products = await listSceneProducts(client)
    expect(products.find(product => product.id === 'lamp')).toMatchObject({
      productName: 'TRADFRI',
      roomName: 'Bedroom',
      groups: [{ id: 'group', name: 'Pair' }],
    })
    expect(products.find(product => product.id === 'group')).toMatchObject({
      capabilities: ['isOn', 'lightLevel', 'colorTemperature'],
      colorTemperatureMin: 2700,
      colorTemperatureMax: 4000,
      productName: null,
      roomName: 'Bedroom',
      members: [
        { id: 'lamp', productName: 'TRADFRI' },
        { id: 'lamp2', productName: 'KAJPLATS' },
      ],
    })
  })

  it('disables group temperature control when member ranges do not overlap', async () => {
    const { client, home } = editableFixture()
    home.devices[1]!.attributes.colorTemperatureMin = 5000
    const group = (await listSceneProducts(client)).find(
      product => product.id === 'group'
    )!
    expect(group.capabilities).not.toContain('colorTemperature')
    expect(group.colorTemperatureMin).toBeNull()
  })

  it('edits white temperature and brightness while preserving other fields and the source snapshot', async () => {
    const { client, input, update, scene } = editableFixture()
    await updateScene(client, 'scene', {
      ...input,
      actions: [
        {
          kind: 'existing',
          index: 0,
          attributes: { lightLevel: 75, colorTemperature: 3200 },
        },
      ],
    })
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [
          {
            ...scene.actions[0],
            attributes: {
              ...scene.actions[0]!.attributes,
              lightLevel: 75,
              colorTemperature: 3200,
            },
          },
        ],
      })
    )
    expect(scene.actions[0]!.attributes.colorTemperature).toBe(2700)
  })

  it('removes selected attributes and replaces white temperature with color', async () => {
    const { client, input, update } = editableFixture()
    await updateScene(client, 'scene', {
      ...input,
      actions: [
        {
          kind: 'existing',
          index: 0,
          attributes: { isOn: null, colorHue: 120, colorSaturation: 0.5 },
        },
      ],
    })
    expect(update.mock.calls[0]![0].actions[0].attributes).toEqual({
      lightLevel: 40,
      customName: 'Preserve me',
      colorHue: 120,
      colorSaturation: 0.5,
    })
  })

  it('adds a non-power product and removes the original product', async () => {
    const { client, input, update } = editableFixture()
    await updateScene(client, 'scene', {
      ...input,
      actions: [
        {
          kind: 'new',
          type: 'device',
          deviceId: 'speaker',
          attributes: { volume: 20, playback: 'playbackPaused' },
        },
      ],
    })
    expect(update.mock.calls[0]![0].actions).toEqual([
      {
        type: 'device',
        deviceId: 'speaker',
        enabled: true,
        attributes: { volume: 20, playback: 'playbackPaused' },
      },
    ])
  })

  it.each([
    { colorTemperature: 5000 },
    { lightLevel: 101 },
    { lightLevel: Number.NaN },
    { volume: 25 },
    { colorHue: 360 },
    { colorSaturation: 1.1 },
    { colorTemperature: 3000, colorHue: 100 },
  ])(
    'rejects unsupported or invalid values without saving: %j',
    async attributes => {
      const { client, input, update } = editableFixture()
      await expect(
        updateScene(client, 'scene', {
          ...input,
          actions: [{ kind: 'existing', index: 0, attributes }],
        })
      ).rejects.toMatchObject({ statusCode: 400 })
      expect(update).not.toHaveBeenCalled()
    }
  )

  it('rejects invalid group temperatures, unsupported playback, duplicate products and empty new actions', async () => {
    const { client, input, update } = editableFixture()
    for (const actions of [
      [
        {
          kind: 'new' as const,
          type: 'deviceSet' as const,
          deviceId: 'group',
          attributes: { colorTemperature: 2600 },
        },
      ],
      [
        {
          kind: 'new' as const,
          type: 'device' as const,
          deviceId: 'speaker',
          attributes: { playback: 'playbackNext' as const },
        },
      ],
      [
        { kind: 'existing' as const, index: 0 },
        {
          kind: 'new' as const,
          type: 'device' as const,
          deviceId: 'lamp',
          attributes: { isOn: true },
        },
      ],
      [
        {
          kind: 'new' as const,
          type: 'device' as const,
          deviceId: 'speaker',
          attributes: {},
        },
      ],
    ]) {
      await expect(
        updateScene(client, 'scene', { ...input, actions })
      ).rejects.toMatchObject({ statusCode: 400 })
    }
    expect(update).not.toHaveBeenCalled()
  })

  it('checks attribute names and value types at the API boundary', () => {
    const { input } = editableFixture()
    expect(
      isSceneUpdateInput({
        ...input,
        actions: [
          {
            kind: 'existing',
            index: 0,
            attributes: { colorTemperature: 3200, lightLevel: null },
          },
        ],
      })
    ).toBe(true)
    for (const attributes of [
      { unknown: 1 },
      { isOn: 'true' },
      { colorTemperature: '3200' },
      { volume: Infinity },
    ]) {
      expect(
        isSceneUpdateInput({
          ...input,
          actions: [{ kind: 'existing', index: 0, attributes }],
        })
      ).toBe(false)
    }
  })
})
