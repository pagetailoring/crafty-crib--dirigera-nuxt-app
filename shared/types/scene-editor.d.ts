import type { Device, Scene } from 'dirigera'

export type SceneAttribute =
  | 'isOn'
  | 'lightLevel'
  | 'colorTemperature'
  | 'colorHue'
  | 'colorSaturation'
  | 'volume'
  | 'playback'

export type SceneAttributeEdits = {
  [K in SceneAttribute]?: Device['attributes'][K] | null
}

export interface SceneProduct {
  id: string
  type: 'device' | 'deviceSet'
  name: string
  productName: string | null
  roomName: string | null
  canSetPower: boolean
  capabilities: SceneAttribute[]
  isReachable: boolean
  groups: { id: string; name: string }[]
  members: {
    id: string
    name: string
    productName: string | null
    roomName: string | null
  }[]
  colorTemperatureMin: number | null
  colorTemperatureMax: number | null
  temperatureRangeReported: boolean
  playbackOptions: string[]
}

export type SceneActionEdit = (
  | { kind: 'existing'; index: number }
  | { kind: 'new'; type: SceneProduct['type']; deviceId: string }
) & {
  /** Legacy power edits remain accepted by the API. */
  isOn?: boolean
  /** Omitted attributes are preserved; null removes an attribute from the scene. */
  attributes?: SceneAttributeEdits
}

export interface SceneDaysEdit {
  index: number
  days: string[]
}

export interface SceneUpdateInput {
  expectedActions: Scene['actions']
  expectedTriggers: Scene['triggers']
  actions: SceneActionEdit[]
  days: SceneDaysEdit[]
}
