import type {
  Device,
  DeviceCommand,
  GraphqlRequest,
  QuickControlType,
  Room,
  RoomSummary,
  Scene,
} from '~/types/dirigera-client'

const roomsQuery = `
  query Rooms {
    rooms {
      id
      name
      icon
      color
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
      icon
    }
  }
`

const activateSceneMutation = `
  mutation ActivateScene($id: String!) {
    activateScene(id: $id)
  }
`

const deviceFields = `
        id
        name
        type
        deviceType
        productName
        roomName
        isReachable
        lastSeen
        batteryPercentage
        isOn
        lightLevel
        colorTemperature
        colorTemperatureMin
        colorTemperatureMax
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
`

const roomQuery = `
  query Room($id: String!) {
    room(id: $id) {
      id
      name
      icon
      color
      devices {
        ${deviceFields}
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

const setColorTemperatureMutation = `
  mutation SetColorTemperature(
    $id: String!
    $type: ControlType!
    $colorTemperature: Int!
  ) {
    setColorTemperature(
      id: $id
      type: $type
      colorTemperature: $colorTemperature
    )
  }
`

const setColorMutation = `
  mutation SetColorHueAndSaturation(
    $id: String!
    $type: ControlType!
    $colorHue: Float!
    $colorSaturation: Float!
  ) {
    setColorHueAndSaturation(
      id: $id
      type: $type
      colorHue: $colorHue
      colorSaturation: $colorSaturation
    )
  }
`

const setPlaybackMutation = `
  mutation SetPlayback(
    $id: String!
    $type: ControlType!
    $playback: Playback!
  ) {
    setPlayback(id: $id, type: $type, playback: $playback)
  }
`

const setVolumeMutation = `
  mutation SetVolume($id: String!, $type: ControlType!, $volume: Int!) {
    setVolume(id: $id, type: $type, volume: $volume)
  }
`

const playItemImageQuery = `
  query DevicePlayItemImage($id: String!) {
    devicePlayItemImageURL(id: $id)
  }
`

/** Create a typed Dirigera client backed by the provided GraphQL request function. */
export function createDirigeraClient(request: GraphqlRequest) {
  return {
    /** Fetch all lights that expose color-temperature controls. */
    async listTemperatureLights() {
      const data = await request<{ temperatureLights: Device[] }>(
        `query TemperatureLights { temperatureLights { ${deviceFields} } }`
      )
      return data.temperatureLights
    },
    /** Fetch summaries of all rooms from the Dirigera backend. */
    async listRooms() {
      const data = await request<{ rooms: RoomSummary[] }>(roomsQuery)
      return data.rooms
    },
    /** Fetch all scenes available through the Dirigera backend. */
    async listScenes() {
      const data = await request<{ scenes: Scene[] }>(scenesQuery)
      return data.scenes
    },
    /** Activate a scene by its Dirigera identifier. */
    async activateScene(id: string) {
      await request(activateSceneMutation, { id })
    },
    /** Fetch a room and its devices by the room's Dirigera identifier. */
    async getRoom(id: string) {
      const data = await request<{ room: Room | null }>(roomQuery, { id })
      return data.room
    },
    /** Apply a quick-control state to the devices in a room. */
    async setQuickControl(
      roomId: string,
      type: QuickControlType,
      isOn: boolean | null
    ) {
      await request(quickControlMutation, { roomId, type, isOn })
    },
    /** Fetch the current play item's image URL for a media device. */
    async getPlayItemImage(id: string) {
      const data = await request<{ devicePlayItemImageURL: string | null }>(
        playItemImageQuery,
        { id }
      )
      return data.devicePlayItemImageURL
    },
    /** Dispatch a typed control command to a device or device set. */
    async controlDevice(id: string, type: ControlType, command: DeviceCommand) {
      if (command.type === 'setVolume') {
        await request(setVolumeMutation, { id, type, volume: command.volume })
        return
      }

      if (command.type === 'setPlayback') {
        await request(setPlaybackMutation, {
          id,
          type,
          playback: command.playback,
        })
        return
      }

      if (command.type === 'setColor') {
        await request(setColorMutation, {
          id,
          type,
          colorHue: command.colorHue,
          colorSaturation: command.colorSaturation,
        })
        return
      }

      if (command.type === 'setColorTemperature') {
        await request(setColorTemperatureMutation, {
          id,
          type,
          colorTemperature: command.colorTemperature,
        })
        return
      }

      if (command.type === 'setLightLevel') {
        await request(setLightLevelMutation, {
          id,
          type,
          lightLevel: command.lightLevel,
        })
        return
      }

      if (command.type === 'setIsOn') {
        await request(setIsOnMutation, { id, type, isOn: command.isOn })
        return
      }

      const unhandled: never = command
      throw new Error(`Unsupported device command: ${unhandled}`)
    },
  }
}
