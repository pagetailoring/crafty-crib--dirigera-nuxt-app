import { defineStore } from 'pinia'

import { DIRIGERA_CACHE_TTL_MS } from '../../config/dirigera-cache'
import type {
  Device,
  DeviceCommand,
  QuickControlType,
  Room,
  RoomSummary,
  Scene,
} from '../services/dirigera-client'

interface CacheEntry<T> {
  data: T
  refreshedAt: number
  stale: boolean
}

interface LoadOptions {
  force?: boolean
}

const isFresh = <T>(entry: CacheEntry<T> | undefined, now: number) =>
  entry != null &&
  !entry.stale &&
  now - entry.refreshedAt < DIRIGERA_CACHE_TTL_MS

const withoutKey = <T>(record: Record<string, T>, key: string) =>
  Object.fromEntries(
    Object.entries(record).filter(([entryKey]) => entryKey !== key)
  ) as Record<string, T>

export const useDirigeraCacheStore = defineStore('dirigera-cache', () => {
  const dirigera = useDirigera()
  const rooms = ref<CacheEntry<RoomSummary[]>>()
  const scenes = ref<CacheEntry<Scene[]>>()
  const roomById = ref<Record<string, CacheEntry<Room>>>({})
  const playItemImageByDeviceId = ref<
    Record<string, CacheEntry<string | null>>
  >({})
  const pending = ref<Record<string, boolean>>({})
  const inFlight = new Map<string, Promise<unknown>>()

  function runDeduplicated<T>(key: string, load: () => Promise<T>): Promise<T> {
    const active = inFlight.get(key)
    if (active) return active as Promise<T>

    pending.value[key] = true
    const promise = load().finally(() => {
      inFlight.delete(key)
      pending.value = withoutKey(pending.value, key)
    })
    inFlight.set(key, promise)
    return promise
  }

  async function loadRooms(options: LoadOptions = {}) {
    if (!options.force && rooms.value && isFresh(rooms.value, Date.now())) {
      return rooms.value.data
    }

    return runDeduplicated('rooms', async () => {
      const data = await dirigera.listRooms()
      rooms.value = { data, refreshedAt: Date.now(), stale: false }
      return data
    })
  }

  async function loadScenes(options: LoadOptions = {}) {
    if (!options.force && scenes.value && isFresh(scenes.value, Date.now())) {
      return scenes.value.data
    }

    return runDeduplicated('scenes', async () => {
      const data = await dirigera.listScenes()
      scenes.value = { data, refreshedAt: Date.now(), stale: false }
      return data
    })
  }

  async function loadHome(options: LoadOptions = {}) {
    const [loadedScenes, loadedRooms] = await Promise.all([
      loadScenes(options),
      loadRooms(options),
    ])
    return { scenes: loadedScenes, rooms: loadedRooms }
  }

  async function loadRoom(id: string, options: LoadOptions = {}) {
    const entry = roomById.value[id]
    if (!options.force && entry && isFresh(entry, Date.now())) return entry.data

    return runDeduplicated(`room:${id}`, async () => {
      const data = await dirigera.getRoom(id)
      if (data == null) {
        roomById.value = withoutKey(roomById.value, id)
        return null
      }

      roomById.value[id] = {
        data,
        refreshedAt: Date.now(),
        stale: false,
      }
      return data
    })
  }

  async function loadPlayItemImage(id: string, options: LoadOptions = {}) {
    const entry = playItemImageByDeviceId.value[id]
    if (!options.force && entry && isFresh(entry, Date.now())) return entry.data

    return runDeduplicated(`play-item-image:${id}`, async () => {
      const data = await dirigera.getPlayItemImage(id)
      playItemImageByDeviceId.value[id] = {
        data,
        refreshedAt: Date.now(),
        stale: false,
      }
      return data
    })
  }

  function invalidateAll() {
    if (rooms.value) rooms.value.stale = true
    if (scenes.value) scenes.value.stale = true
    Object.values(roomById.value).forEach(entry => (entry.stale = true))
    Object.values(playItemImageByDeviceId.value).forEach(
      entry => (entry.stale = true)
    )
  }

  async function activateScene(id: string) {
    await dirigera.activateScene(id)
  }

  async function setQuickControl(
    roomId: string,
    type: QuickControlType,
    isOn: boolean | null
  ) {
    await dirigera.setQuickControl(roomId, type, isOn)

    const control = rooms.value?.data
      .find(room => room.id === roomId)
      ?.quickControls.find(item => item.type === type)
    if (control) control.isOn = isOn

    await loadRooms({ force: true })
  }

  function applyDeviceCommand(device: Device, command: DeviceCommand) {
    if (command.type === 'setIsOn') device.isOn = command.isOn
    if (command.type === 'setLightLevel') {
      device.lightLevel = command.lightLevel
    }
    if (command.type === 'setColorTemperature') {
      device.colorTemperature = command.colorTemperature
    }
    if (command.type === 'setColor') {
      device.colorHue = command.colorHue
      device.colorSaturation = command.colorSaturation
    }
    if (command.type === 'setPlayback') device.playback = command.playback
    if (command.type === 'setVolume') device.volume = command.volume
  }

  async function controlDevice(device: Device, command: DeviceCommand) {
    await dirigera.controlDevice(device.id, device.type, command)

    const affectedRoomIds: string[] = []
    for (const [roomId, entry] of Object.entries(roomById.value)) {
      const cachedDevice = entry.data.devices.find(
        item => item.id === device.id
      )
      if (!cachedDevice) continue
      applyDeviceCommand(cachedDevice, command)
      affectedRoomIds.push(roomId)
    }

    await Promise.all(
      affectedRoomIds.map(roomId => loadRoom(roomId, { force: true }))
    )
  }

  return {
    rooms,
    scenes,
    roomById,
    playItemImageByDeviceId,
    pending,
    loadRooms,
    loadScenes,
    loadHome,
    loadRoom,
    loadPlayItemImage,
    invalidateAll,
    activateScene,
    setQuickControl,
    controlDevice,
  }
})
