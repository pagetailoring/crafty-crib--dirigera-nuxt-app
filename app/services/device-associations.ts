import type { Device, Scene } from 'dirigera'

export interface DeviceAssociations {
  devices: Device[]
  remotes: Device[]
  scenes: Scene[]
}

function isLinked(first: Device, second: Device) {
  const firstIds = [first.id, first.relationId].filter(Boolean) as string[]
  const secondIds = [second.id, second.relationId].filter(Boolean) as string[]
  return (
    first.remoteLinks?.some(id => secondIds.includes(id)) ||
    second.remoteLinks?.some(id => firstIds.includes(id)) ||
    false
  )
}

export function deviceAssociations(
  device: Device,
  devices: Device[],
  scenes: Scene[]
): DeviceAssociations {
  const isRemote = device.type === 'controller'
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
            action.deviceId === device.id ||
            (action.type === 'deviceSet' &&
              device.deviceSet.some(set => set.id === action.deviceId))
        ) ||
        scene.triggers?.some(
          trigger =>
            trigger.type === 'event' && trigger.trigger.deviceId === device.id
        )
  )

  return {
    devices: isRemote ? linked : [],
    remotes: isRemote ? [] : linked,
    scenes: associatedScenes,
  }
}
