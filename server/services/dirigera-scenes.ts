import type { DirigeraClient, Scene } from 'dirigera'
import type {
  SceneProduct,
  SceneUpdateInput,
} from '../../shared/types/scene-editor'
import { WEEKDAYS } from '../../config/scene'

export class SceneEditError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message)
  }
}

export function listSceneDetails(client: DirigeraClient) {
  return client.scenes.list()
}

export async function listSceneProducts(
  client: DirigeraClient
): Promise<SceneProduct[]> {
  const home = await client.home()
  const devices = home.devices.map(device => ({
    id: device.id,
    type: 'device' as const,
    name: device.attributes.customName,
    productName: device.attributes.model ?? null,
    roomName: device.room?.name ?? null,
    canSetPower: device.capabilities.canReceive.includes('isOn'),
  }))
  const sets = home.deviceSets.map(set => {
    const members = home.devices.filter(device =>
      device.deviceSet.some(member => member.id === set.id)
    )
    return {
      id: set.id,
      type: 'deviceSet' as const,
      name: set.name,
      productName: null,
      roomName: null,
      canSetPower:
        members.length > 0 &&
        members.every(device =>
          device.capabilities.canReceive.includes('isOn')
        ),
    }
  })

  return [...devices, ...sets].sort((a, b) => a.name.localeCompare(b.name))
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function isSceneUpdateInput(value: unknown): value is SceneUpdateInput {
  if (!isObject(value)) return false
  if (!Array.isArray(value.expectedActions)) return false
  if (
    value.expectedTriggers !== undefined &&
    !Array.isArray(value.expectedTriggers)
  )
    return false
  if (!Array.isArray(value.actions) || !Array.isArray(value.days)) return false

  return (
    value.actions.every(action => {
      if (!isObject(action)) return false
      if (action.kind === 'existing') {
        return (
          Number.isInteger(action.index) &&
          (action.isOn === undefined || typeof action.isOn === 'boolean')
        )
      }
      return (
        action.kind === 'new' &&
        (action.type === 'device' || action.type === 'deviceSet') &&
        typeof action.deviceId === 'string' &&
        typeof action.isOn === 'boolean'
      )
    }) &&
    value.days.every(day => {
      if (!isObject(day)) return false
      return (
        Number.isInteger(day.index) &&
        Array.isArray(day.days) &&
        day.days.length > 0 &&
        day.days.every(item => typeof item === 'string')
      )
    })
  )
}

function triggerSnapshot(triggers: Scene['triggers']) {
  return JSON.stringify(triggers, (key, value) =>
    key === 'triggeredAt' || key === 'nextTriggerAt' ? undefined : value
  )
}

export async function updateScene(
  client: DirigeraClient,
  id: string,
  input: SceneUpdateInput
): Promise<Scene> {
  const scene = await client.scenes.get({ id })
  if (scene.type !== 'userScene' || scene.commands.length > 0) {
    throw new SceneEditError('This scene cannot be edited here.', 400)
  }
  if (
    JSON.stringify(scene.actions) !== JSON.stringify(input.expectedActions) ||
    triggerSnapshot(scene.triggers) !== triggerSnapshot(input.expectedTriggers)
  ) {
    throw new SceneEditError(
      'The scene changed. Reload it before editing.',
      409
    )
  }

  const usedIndices = new Set<number>()
  const products = await listSceneProducts(client)
  const retainedProducts = new Set(
    input.actions.flatMap(edit => {
      if (edit.kind !== 'existing') return []
      const action = scene.actions[edit.index]
      return action?.deviceId ? [`${action.type}:${action.deviceId}`] : []
    })
  )
  const addedProducts = new Set<string>()
  const actions: Scene['actions'] = input.actions.map(edit => {
    if (edit.kind === 'existing') {
      if (
        edit.index < 0 ||
        edit.index >= scene.actions.length ||
        usedIndices.has(edit.index)
      ) {
        throw new SceneEditError('Invalid scene action.', 400)
      }
      usedIndices.add(edit.index)
      const original = scene.actions[edit.index]!
      return edit.isOn === undefined
        ? original
        : {
            ...original,
            attributes: { ...original.attributes, isOn: edit.isOn },
          }
    }

    const product = products.find(
      item => item.type === edit.type && item.id === edit.deviceId
    )
    if (!product?.canSetPower) {
      throw new SceneEditError('Select a product that supports power.', 400)
    }
    const productKey = `${edit.type}:${edit.deviceId}`
    if (retainedProducts.has(productKey) || addedProducts.has(productKey)) {
      throw new SceneEditError('The product is already in this scene.', 400)
    }
    addedProducts.add(productKey)
    return {
      type: edit.type,
      deviceId: edit.deviceId,
      enabled: true,
      attributes: { isOn: edit.isOn },
    }
  })

  const triggers = structuredClone(scene.triggers ?? [])
  const usedTriggerIndices = new Set<number>()
  for (const edit of input.days) {
    const trigger = triggers[edit.index]
    if (
      !trigger ||
      usedTriggerIndices.has(edit.index) ||
      !('trigger' in trigger) ||
      (trigger.type !== 'time' && !('days' in trigger.trigger)) ||
      edit.days.some(day => !WEEKDAYS.some(weekday => weekday === day)) ||
      new Set(edit.days).size !== edit.days.length
    ) {
      throw new SceneEditError('Invalid schedule days.', 400)
    }
    usedTriggerIndices.add(edit.index)
    trigger.trigger.days = WEEKDAYS.filter(day => edit.days.includes(day))
  }

  await client.scenes.update({
    id,
    info: scene.info,
    type: scene.type,
    actions,
    triggers: scene.triggers ? triggers : undefined,
  })
  return client.scenes.get({ id })
}
