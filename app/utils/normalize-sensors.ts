import type { Device } from 'dirigera'
import type { NormalizedDevice } from '~/types/normalize-sensors'

const isSensor = (device: Device) =>
  device.type === 'sensor' ||
  (device.type === 'unknown' && device.deviceType === 'lightSensor')

/** Combine sensor endpoints for display without changing the hub's records. */
export function normalizeSensors(devices: Device[]): NormalizedDevice[] {
  const groups = new Map<string, Device[]>()
  for (const device of devices) {
    if (!device.relationId || !isSensor(device)) continue
    const group = groups.get(device.relationId) ?? []
    group.push(device)
    groups.set(device.relationId, group)
  }

  const emitted = new Set<string>()
  const normalized = devices.flatMap<NormalizedDevice>(device => {
    const group = device.relationId && groups.get(device.relationId)
    if (
      !device.relationId ||
      !isSensor(device) ||
      !group ||
      group.length < 2 ||
      !group.some(member => member.type === 'sensor') ||
      new Set(group.map(member => member.room?.id).filter(Boolean)).size > 1
    ) {
      return [device]
    }
    if (emitted.has(device.relationId)) return []
    emitted.add(device.relationId)

    const primary =
      group.find(member => member.type === 'sensor' && member.room) ??
      group.find(member => member.type === 'sensor')!
    const attributes = Object.assign(
      {},
      ...[...group.filter(member => member !== primary), primary].map(member =>
        Object.fromEntries(
          Object.entries(member.attributes).filter(([, value]) => value != null)
        )
      )
    ) as Device['attributes']

    return [
      {
        ...primary,
        room: group.find(member => member.room)?.room,
        attributes,
        sourceIds: group.map(member => member.id),
        remoteLinks: [
          ...new Set(group.flatMap(member => member.remoteLinks ?? [])),
        ],
        deviceSet: [
          ...new Map(
            group.flatMap(member => member.deviceSet).map(set => [set.id, set])
          ).values(),
        ],
      },
    ]
  })

  return normalized.map(device => {
    const temperature = device.attributes.currentTemperature
    if (
      !isSensor(device) ||
      temperature == null ||
      !Number.isFinite(temperature)
    ) {
      return device
    }

    return {
      ...device,
      attributes: {
        ...device.attributes,
        currentTemperature: Math.round(temperature * 100) / 100,
      },
    }
  })
}
