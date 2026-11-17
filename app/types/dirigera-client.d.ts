export type QuickControlType = 'LIGHTS' | 'OUTLETS' | 'SPEAKERS'

export interface QuickControl {
  id: string
  type: QuickControlType
  isOn: boolean | null
}

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

export interface Scene {
  id: string
  name: string
  icon?: string | null
}

export type ControlType = 'DEVICE' | 'DEVICE_SET'

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

export interface Room {
  id: string
  name: string
  icon?: string | null
  color?: string | null
  devices: Device[]
}

export type GraphqlRequest = <T>(
  query: string,
  variables?: Record<string, unknown>
) => Promise<T>

export type DeviceCommand =
  | { type: 'setIsOn'; isOn: boolean }
  | { type: 'setLightLevel'; lightLevel: number }
  | { type: 'setColorTemperature'; colorTemperature: number }
  | { type: 'setColor'; colorHue: number; colorSaturation: number }
  | { type: 'setPlayback'; playback: Playback }
  | { type: 'setVolume'; volume: number }

export type Playback =
  'playbackPlaying' | 'playbackPaused' | 'playbackNext' | 'playbackPrevious'
