export type QuickControlType = 'LIGHTS' | 'OUTLETS' | 'SPEAKERS'

export interface QuickControl {
  id: string
  type: QuickControlType
  isOn: boolean | null
}

export interface RoomSummary {
  id: string
  name: string
  temperature: number | null
  humidity: number | null
  pm25: number | null
  vocIndex: number | null
  co2: number | null
  quickControls: QuickControl[]
}

export interface Scene {
  id: string
  name: string
}

export type ControlType = 'DEVICE' | 'DEVICE_SET'

export interface Device {
  id: string
  name: string
  type: ControlType
  isReachable: boolean
  lastSeen: string
  batteryPercentage: number | null
  isOn: boolean | null
  lightLevel: number | null
  colorTemperature: number | null
  colorSaturation: number | null
  colorHue: number | null
  playback: string | null
  playbackNextAvailable: boolean | null
  playbackPreviousAvailable: boolean | null
  volume: number | null
  playItem: string | null
  nextPlayItem: string | null
  temperature: number | null
  humidity: number | null
  pm25: number | null
  vocIndex: number | null
  co2: number | null
  isOpen: boolean | null
  isDetected: boolean | null
  illuminance: number | null
}

export interface Room {
  id: string
  name: string
  devices: Device[]
}

type GraphqlRequest = <T>(
  query: string,
  variables?: Record<string, unknown>
) => Promise<T>

export type DeviceCommand =
  | { type: 'setIsOn'; isOn: boolean }
  | { type: 'setLightLevel'; lightLevel: number }

const roomsQuery = `
  query Rooms {
    rooms {
      id
      name
      temperature
      humidity
      pm25
      vocIndex
      co2
      quickControls {
        id
        type
        isOn
      }
    }
  }
`

const scenesQuery = `
  query Scenes {
    scenes {
      id
      name
    }
  }
`

const activateSceneMutation = `
  mutation ActivateScene($id: String!) {
    activateScene(id: $id)
  }
`

const roomQuery = `
  query Room($id: String!) {
    room(id: $id) {
      id
      name
      devices {
        id
        name
        type
        isReachable
        lastSeen
        batteryPercentage
        isOn
        lightLevel
        colorTemperature
        colorSaturation
        colorHue
        playback
        playbackNextAvailable
        playbackPreviousAvailable
        volume
        playItem
        nextPlayItem
        temperature
        humidity
        pm25
        vocIndex
        co2
        isOpen
        isDetected
        illuminance
      }
    }
  }
`

const quickControlMutation = `
  mutation QuickControl(
    $roomId: String!
    $type: QuickControlType!
    $isOn: Boolean
  ) {
    quickControl(roomId: $roomId, type: $type, isOn: $isOn)
  }
`

const setIsOnMutation = `
  mutation SetIsOn($id: String!, $type: ControlType!, $isOn: Boolean!) {
    setIsOn(id: $id, type: $type, isOn: $isOn)
  }
`

const setLightLevelMutation = `
  mutation SetLightLevel($id: String!, $type: ControlType!, $lightLevel: Int!) {
    setLightLevel(id: $id, type: $type, lightLevel: $lightLevel)
  }
`

export function createDirigeraClient(request: GraphqlRequest) {
  return {
    async listRooms() {
      const data = await request<{ rooms: RoomSummary[] }>(roomsQuery)
      return data.rooms
    },
    async listScenes() {
      const data = await request<{ scenes: Scene[] }>(scenesQuery)
      return data.scenes
    },
    async activateScene(id: string) {
      await request(activateSceneMutation, { id })
    },
    async getRoom(id: string) {
      const data = await request<{ room: Room | null }>(roomQuery, { id })
      return data.room
    },
    async setQuickControl(
      roomId: string,
      type: QuickControlType,
      isOn: boolean | null
    ) {
      await request(quickControlMutation, { roomId, type, isOn })
    },
    async controlDevice(id: string, type: ControlType, command: DeviceCommand) {
      if (command.type === 'setLightLevel') {
        await request(setLightLevelMutation, {
          id,
          type,
          lightLevel: command.lightLevel,
        })
        return
      }

      await request(setIsOnMutation, { id, type, isOn: command.isOn })
    },
  }
}
