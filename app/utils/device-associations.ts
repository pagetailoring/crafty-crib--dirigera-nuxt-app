import type { DeviceAssociations } from '~/types/device-associations'
import type { Device, Scene } from 'dirigera'
import type { NormalizedDevice } from '~/types/normalize-sensors'

function isLinked(first: NormalizedDevice, second: NormalizedDevice) {
  const firstIds = [
    first.id,
    first.relationId,
    ...(first.sourceIds ?? []),
  ].filter(Boolean) as string[]
  const secondIds = [
    second.id,
    second.relationId,
    ...(second.sourceIds ?? []),
  ].filter(Boolean) as string[]
  return (
    first.remoteLinks?.some(id => secondIds.includes(id)) ||
    second.remoteLinks?.some(id => firstIds.includes(id)) ||
    false
  )
}

export function deviceAssociations(
  device: NormalizedDevice,
  devices: Device[],
  scenes: Scene[]
): DeviceAssociations {
  const isRemote = device.type === 'controller'
  const sourceIds = device.sourceIds ?? [device.id]
  const linked = devices.filter(
    other =>
      other.id !== device.id &&
      (isRemote ? other.type !== 'controller' : other.type === 'controller') &&
      isLinked(device, other)
  )
  const associatedScenes = scenes.filter(scene =>
    isRemote
      ? scene.triggers?.some(
          trigger =>
            trigger.type === 'controller' &&
            trigger.trigger.deviceId === device.id
        )
      : scene.actions.some(
          action =>
            (action.deviceId != null && sourceIds.includes(action.deviceId)) ||
            (action.type === 'deviceSet' &&
              device.deviceSet.some(set => set.id === action.deviceId))
        ) ||
        scene.triggers?.some(
          trigger =>
            trigger.type === 'event' &&
            sourceIds.includes(trigger.trigger.deviceId)
        )
  )

  return {
    devices: isRemote ? linked : [],
    remotes: isRemote ? [] : linked,
    scenes: associatedScenes,
  }
}
