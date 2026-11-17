/** Room-wide device categories supported by quick controls. */
export type QuickControlType = 'LIGHTS' | 'OUTLETS' | 'SPEAKERS'

/** Current state of a room-wide quick control. */
export interface QuickControl {
  id: string
  type: QuickControlType
  isOn: boolean | null
}

/** Room data used by room lists and overview cards. */
export interface RoomSummary {
  id: string
  name: string
  icon?: string | null
  color?: string | null
  temperature: number | null
  humidity: number | null
  pm25: number | null
  vocIndex: number | null
  co2: number | null
  quickControls: QuickControl[]
}

/** Scene data required by scene lists and activation controls. */
export interface Scene {
  id: string
  name: string
  icon?: string | null
}

/** Target kind accepted by device-control mutations. */
export type ControlType = 'DEVICE' | 'DEVICE_SET'

/** Flattened device or device-set data returned to the app. */
export interface Device {
  id: string
  name: string
  type: ControlType
  deviceType: string | null
  productName: string | null
  roomName?: string | null
  isReachable: boolean
  lastSeen: string
  batteryPercentage: number | null
  isOn: boolean | null
  lightLevel: number | null
  colorTemperature: number | null
  colorTemperatureMin?: number | null
  colorTemperatureMax?: number | null
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

/** Room details together with its controllable devices. */
export interface Room {
  id: string
  name: string
  icon?: string | null
  color?: string | null
  devices: Device[]
}

/** Execute a GraphQL operation and return its typed data payload. */
export type GraphqlRequest = <T>(
  query: string,
  variables?: Record<string, unknown>
) => Promise<T>

/** Control command supported by the app's Dirigera client. */
export type DeviceCommand =
  | { type: 'setIsOn'; isOn: boolean }
  | { type: 'setLightLevel'; lightLevel: number }
  | { type: 'setColorTemperature'; colorTemperature: number }
  | { type: 'setColor'; colorHue: number; colorSaturation: number }
  | { type: 'setPlayback'; playback: Playback }
  | { type: 'setVolume'; volume: number }

/** Playback action accepted by speaker controls. */
export type Playback =
  'playbackPlaying' | 'playbackPaused' | 'playbackNext' | 'playbackPrevious'
