import type { Device, DirigeraClient, Scene } from 'dirigera'
import { WEEKDAYS } from '@@/config/scene'
import { getColorTemperatureRange } from '#shared/utils/color-temperature'
import {
  SCENE_ATTRIBUTES,
  SCENE_NUMERIC_CONTROLS,
  sceneNumericControl,
} from '@@/config/scene-controls'
import type { SceneNumericAttribute } from '@@/config/scene-controls'

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
  function describe(members: Device[]) {
    const capabilities = SCENE_ATTRIBUTES.filter(
      key =>
        members.length > 0 &&
        members.every(device => device.capabilities.canReceive.includes(key))
    )
    const ranges = members.map(device =>
      getColorTemperatureRange(device.attributes)
    )
    const min = Math.max(...ranges.map(range => range.min))
    const max = Math.min(...ranges.map(range => range.max))
    if (min > max) {
      const index = capabilities.indexOf('colorTemperature')
      if (index !== -1) capabilities.splice(index, 1)
    }
    const playbackOptions = capabilities.includes('playback')
      ? [
          'playbackPlaying',
          ...(members.every(
            device => device.attributes.playbackAvailableActions?.pause
          )
            ? ['playbackPaused']
            : []),
          ...(members.every(
            device => device.attributes.playbackAvailableActions?.playbackNext
          )
            ? ['playbackNext']
            : []),
          ...(members.every(
            device => device.attributes.playbackAvailableActions?.playbackPrev
          )
            ? ['playbackPrevious']
            : []),
        ]
      : []
    return {
      capabilities,
      canSetPower: capabilities.includes('isOn'),
      isReachable:
        members.length > 0 && members.every(device => device.isReachable),
      colorTemperatureMin: capabilities.includes('colorTemperature')
        ? min
        : null,
      colorTemperatureMax: capabilities.includes('colorTemperature')
        ? max
        : null,
      temperatureRangeReported:
        ranges.length > 0 && ranges.every(range => range.reported),
      playbackOptions,
    }
  }
  const devices: SceneProduct[] = home.devices.map(device => ({
    id: device.id,
    type: 'device',
    name: device.attributes.customName,
    productName: device.attributes.model ?? null,
    roomName: device.room?.name ?? null,
    groups: device.deviceSet.map(set => ({ id: set.id, name: set.name })),
    members: [],
    ...describe([device]),
  }))
  const sets: SceneProduct[] = home.deviceSets.map(set => {
    const members = home.devices.filter(device =>
      device.deviceSet.some(member => member.id === set.id)
    )
    const models = new Set(members.map(device => device.attributes.model))
    const rooms = new Set(members.map(device => device.room?.name))
    return {
      id: set.id,
      type: 'deviceSet',
      name: set.name,
      productName: models.size === 1 ? ([...models][0] ?? null) : null,
      roomName: rooms.size === 1 ? ([...rooms][0] ?? null) : null,
      groups: [],
      members: members.map(device => ({
        id: device.id,
        name: device.attributes.customName,
        productName: device.attributes.model ?? null,
        roomName: device.room?.name ?? null,
      })),
      ...describe(members),
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
      if (
        action.attributes !== undefined &&
        (!isObject(action.attributes) ||
          !Object.entries(action.attributes).every(
            ([key, value]) =>
              SCENE_ATTRIBUTES.some(attribute => attribute === key) &&
              (value === null ||
                (key === 'isOn'
                  ? typeof value === 'boolean'
                  : key === 'playback'
                    ? typeof value === 'string'
                    : typeof value === 'number' && Number.isFinite(value)))
          ))
      )
        return false
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
        (action.isOn === undefined || typeof action.isOn === 'boolean')
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

function applyAttributes(
  original: Scene['actions'][number]['attributes'],
  patch: SceneAttributeEdits,
  product: SceneProduct | undefined
): Scene['actions'][number]['attributes'] {
  const attributes = { ...original }
  for (const [key, value] of Object.entries(patch)) {
    if (!SCENE_ATTRIBUTES.some(attribute => attribute === key)) {
      throw new SceneEditError('Unsupported scene attribute.', 400)
    }
    if (value === undefined || original[key as keyof typeof original] === value)
      continue
    if (value === null) {
      Reflect.deleteProperty(attributes, key)
      continue
    }
    if (!product?.capabilities.some(attribute => attribute === key)) {
      throw new SceneEditError(`The product does not support ${key}.`, 400)
    }
    if (key === 'isOn') {
      if (typeof value !== 'boolean')
        throw new SceneEditError('Invalid power state.', 400)
    } else if (key === 'playback') {
      if (
        typeof value !== 'string' ||
        !product.playbackOptions.includes(value)
      ) {
        throw new SceneEditError('Unsupported playback action.', 400)
      }
    } else {
      const control = sceneNumericControl(key as SceneNumericAttribute, product)
      if (
        !Object.hasOwn(SCENE_NUMERIC_CONTROLS, key) ||
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < control.min ||
        value > control.max ||
        (control.step === 1 && !Number.isInteger(value))
      ) {
        throw new SceneEditError(`Invalid ${key} for this product.`, 400)
      }
    }
    Object.assign(attributes, { [key]: value })
  }
  const setsTemperature = patch.colorTemperature != null
  const setsColor = patch.colorHue != null || patch.colorSaturation != null
  if (setsTemperature && setsColor)
    throw new SceneEditError('Choose white temperature or color.', 400)
  if (setsTemperature) {
    delete attributes.colorHue
    delete attributes.colorSaturation
    if (attributes.colorMode !== undefined) attributes.colorMode = 'temperature'
  } else if (setsColor) {
    delete attributes.colorTemperature
    if (attributes.colorMode !== undefined) attributes.colorMode = 'color'
  }
  if (!Object.keys(attributes).length)
    throw new SceneEditError(
      'Choose at least one action for each product, or remove it.',
      400
    )
  return attributes
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
      const product = products.find(
        item => item.type === original.type && item.id === original.deviceId
      )
      const patch = {
        ...edit.attributes,
        ...(edit.isOn === undefined ? {} : { isOn: edit.isOn }),
      }
      if (!Object.keys(patch).length) return original
      return {
        ...original,
        attributes: applyAttributes(original.attributes, patch, product),
      }
    }

    const product = products.find(
      item => item.type === edit.type && item.id === edit.deviceId
    )
    if (!product)
      throw new SceneEditError('The product is no longer available.', 400)
    const productKey = `${edit.type}:${edit.deviceId}`
    if (retainedProducts.has(productKey) || addedProducts.has(productKey)) {
      throw new SceneEditError('The product is already in this scene.', 400)
    }
    addedProducts.add(productKey)
    return {
      type: edit.type,
      deviceId: edit.deviceId,
      enabled: true,
      attributes: applyAttributes(
        {},
        {
          ...edit.attributes,
          ...(edit.isOn === undefined ? {} : { isOn: edit.isOn }),
        },
        product
      ),
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
