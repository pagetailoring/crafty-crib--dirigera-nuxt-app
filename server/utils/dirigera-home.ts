import type { DirigeraControlType as ControlType } from '@@/server/types/dirigera-home'
// Device mappings adapted from lpgera/dirigera-web. See THIRD_PARTY_NOTICES.md.
import type { Device, DeviceSet, Home } from 'dirigera'

import { getColorTemperatureRange } from '#shared/utils/color-temperature'

export function getAttributeIfCanReceive<T extends keyof Device['attributes']>(
  device: Device,
  attribute: T
) {
  return device.capabilities.canReceive.includes(attribute)
    ? device.attributes[attribute]
    : null
}

export function getDevicesNotInSet(devices: Device[]) {
  return getDeviceViews(devices.filter(d => d.deviceSet.length === 0))
}

export function getDeviceViews(devices: Device[]) {
  return devices.map(device => {
    const playItem = device.attributes.playbackAudio?.playItem
    const nextPlayItem = device.attributes.playbackAudio?.nextPlayItem

    return {
      id: device.id,
      name: device.attributes.customName,
      type: 'DEVICE' as ControlType,
      deviceType: device.deviceType,
      productName: device.attributes.model,
      roomName: device.room?.name ?? null,
      isReachable: device.isReachable,
      lastSeen: device.lastSeen,
      batteryPercentage: device.attributes.batteryPercentage,
      isOn: getAttributeIfCanReceive(device, 'isOn'),
      lightLevel: getAttributeIfCanReceive(device, 'lightLevel'),
      colorTemperature: getAttributeIfCanReceive(device, 'colorTemperature'),
      colorTemperatureMin: device.attributes.colorTemperatureMin,
      colorTemperatureMax: device.attributes.colorTemperatureMax,
      colorSaturation: getAttributeIfCanReceive(device, 'colorSaturation'),
      colorHue: getAttributeIfCanReceive(device, 'colorHue'),
      playback: getAttributeIfCanReceive(device, 'playback'),
      playbackPauseAvailable: device.attributes.playbackAvailableActions?.pause,
      playbackNextAvailable:
        device.attributes.playbackAvailableActions?.playbackNext,
      playbackPreviousAvailable:
        device.attributes.playbackAvailableActions?.playbackPrev,
      volume: getAttributeIfCanReceive(device, 'volume'),
      playItem: playItem ? `${playItem.artist} - ${playItem.title}` : null,
      nextPlayItem: nextPlayItem
        ? `${nextPlayItem.artist} - ${nextPlayItem.title}`
        : null,
      temperature: device.attributes.currentTemperature,
      humidity: device.attributes.currentRH,
      pm25: device.attributes.currentPM25,
      vocIndex: device.attributes.vocIndex,
      co2: device.attributes.currentCO2,
      isOpen: device.attributes.isOpen,
      isDetected: device.attributes.isDetected,
      illuminance: device.attributes.illuminance,
    }
  })
}

export function getDeviceSets(devices: Device[]) {
  const deviceSets = [
    ...devices
      .flatMap(d => d.deviceSet)
      .reduce((map, item) => {
        if (!map.has(item.id)) {
          map.set(item.id, item)
        }
        return map
      }, new Map<string, DeviceSet>())
      .values(),
  ]

  return deviceSets.map(deviceSet => {
    const devicesInSet = devices.filter(d =>
      d.deviceSet.some(ds => ds.id === deviceSet.id)
    )

    const playItem = devicesInSet[0]?.attributes?.playbackAudio?.playItem
    const nextPlayItem =
      devicesInSet[0]?.attributes?.playbackAudio?.nextPlayItem
    const deviceTypes = new Set(devicesInSet.map(device => device.deviceType))
    const productNames = new Set(
      devicesInSet.map(device => device.attributes.model)
    )
    const roomNames = new Set(devicesInSet.map(device => device.room?.name))

    const ranges = devicesInSet.map(device =>
      getColorTemperatureRange(device.attributes)
    )
    const temperatureMin = Math.max(...ranges.map(range => range.min))
    const temperatureMax = Math.min(...ranges.map(range => range.max))
    const canSetTemperature =
      devicesInSet.every(device =>
        device.capabilities.canReceive.includes('colorTemperature')
      ) && temperatureMin <= temperatureMax

    return {
      id: deviceSet.id,
      name: deviceSet.name,
      type: 'DEVICE_SET' as ControlType,
      deviceType:
        deviceTypes.size === 1
          ? (deviceTypes.values().next().value ?? null)
          : null,
      productName:
        productNames.size === 1
          ? (productNames.values().next().value ?? null)
          : null,
      roomName:
        roomNames.size === 1 ? (roomNames.values().next().value ?? null) : null,
      isReachable: devicesInSet.every(d => d.isReachable),
      lastSeen: devicesInSet.map(d => d.lastSeen).toSorted()[0],
      batteryPercentage: devicesInSet[0]?.attributes.batteryPercentage,
      isOn: devicesInSet.some(d => d.attributes.isOn),
      lightLevel: devicesInSet[0]?.attributes.lightLevel,
      colorTemperature: canSetTemperature
        ? devicesInSet[0]?.attributes.colorTemperature
        : null,
      colorTemperatureMin: canSetTemperature ? temperatureMin : null,
      colorTemperatureMax: canSetTemperature ? temperatureMax : null,
      colorSaturation: devicesInSet[0]?.attributes.colorSaturation,
      colorHue: devicesInSet[0]?.attributes.colorHue,
      playback: devicesInSet[0]?.attributes.playback,
      playbackPauseAvailable:
        devicesInSet[0]?.attributes.playbackAvailableActions?.pause,
      playbackNextAvailable:
        devicesInSet[0]?.attributes.playbackAvailableActions?.playbackNext,
      playbackPreviousAvailable:
        devicesInSet[0]?.attributes.playbackAvailableActions?.playbackPrev,
      volume: devicesInSet[0]?.attributes.volume,
      playItem: playItem ? `${playItem?.artist} - ${playItem?.title}` : null,
      nextPlayItem: nextPlayItem
        ? `${nextPlayItem?.artist} - ${nextPlayItem?.title}`
        : null,
      temperature: devicesInSet[0]?.attributes.currentTemperature,
      humidity: devicesInSet[0]?.attributes.currentRH,
      pm25: devicesInSet[0]?.attributes.currentPM25,
      vocIndex: devicesInSet[0]?.attributes.vocIndex,
      isOpen: devicesInSet[0]?.attributes.isOpen,
      isDetected: devicesInSet[0]?.attributes.isDetected,
      illuminance: devicesInSet[0]?.attributes.illuminance,
    }
  })
}

const hasControl = (d: {
  isOn: boolean | null | undefined
  lightLevel: number | null | undefined
  colorTemperature: number | null | undefined
  colorSaturation: number | null | undefined
  colorHue: number | null | undefined
  playback: string | null | undefined
  volume: number | null | undefined
}) =>
  d.isOn !== null ||
  d.lightLevel !== null ||
  d.colorTemperature !== null ||
  d.colorSaturation !== null ||
  d.colorHue !== null ||
  d.playback !== null ||
  d.volume !== null

function getDevicesInRoomWithRelations({
  roomId,
  devices,
}: {
  roomId: string
  devices: Device[]
}) {
  const devicesInRoom = devices.filter(device => device.room?.id === roomId)

  return devicesInRoom.map(d => ({
    ...d,
    attributes: devices.reduce((acc, currentDevice) => {
      if (Boolean(d.relationId) && d.relationId === currentDevice.relationId) {
        return {
          ...currentDevice.attributes,
          ...acc,
        }
      }
      return acc
    }, d.attributes),
  }))
}

function getAverageAttributeValue({
  devices,
  attribute,
}: {
  devices: Device[]
  attribute:
    | 'currentTemperature'
    | 'currentRH'
    | 'currentPM25'
    | 'vocIndex'
    | 'currentCO2'
}) {
  const attributeValues = devices
    .map(d => d.attributes[attribute])
    .filter(t => t != null)

  if (attributeValues.length === 0) {
    return null
  }

  return (
    attributeValues.reduce((acc, current) => acc + current, 0) /
    attributeValues.length
  )
}

export function getRoomView(room: Home['rooms'][number], home: Home) {
  const devices = getDevicesInRoomWithRelations({
    roomId: room.id,
    devices: home.devices,
  })
  const reachable = home.devices.filter(
    d => d.room?.id === room.id && d.isReachable
  )
  const quickControls = (['light', 'outlet', 'speaker'] as const).flatMap(
    type => {
      const matching = reachable.filter(d => d.type === type)
      if (!matching.length) return []
      return [
        {
          id: `${room.id}-${type}s`,
          type: `${type.toUpperCase()}S`,
          isOn: matching.some(d =>
            type === 'speaker'
              ? d.attributes.playback === 'playbackPlaying'
              : d.attributes.isOn
          ),
        },
      ]
    }
  )
  return {
    id: room.id,
    name: room.name,
    icon: room.icon ?? null,
    color: room.color ?? null,
    devices: [...getDevicesNotInSet(devices), ...getDeviceSets(devices)]
      .sort((a, b) => a.name.localeCompare(b.name))
      .sort((a, b) => Number(hasControl(b)) - Number(hasControl(a))),
    quickControls,
    temperature: getAverageAttributeValue({
      devices,
      attribute: 'currentTemperature',
    }),
    humidity: getAverageAttributeValue({ devices, attribute: 'currentRH' }),
    pm25: getAverageAttributeValue({ devices, attribute: 'currentPM25' }),
    vocIndex: getAverageAttributeValue({ devices, attribute: 'vocIndex' }),
    co2: getAverageAttributeValue({ devices, attribute: 'currentCO2' }),
  }
}
