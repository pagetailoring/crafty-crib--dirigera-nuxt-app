import type { Device, Scene } from 'dirigera'

declare global {
  type SceneAttribute =
    | 'isOn'
    | 'lightLevel'
    | 'colorTemperature'
    | 'colorHue'
    | 'colorSaturation'
    | 'volume'
    | 'playback'

  type SceneAttributeEdits = {
    [K in SceneAttribute]?: Device['attributes'][K] | null
  }

  interface SceneProduct {
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

  type SceneActionEdit = (
    | { kind: 'existing'; index: number }
    | { kind: 'new'; type: SceneProduct['type']; deviceId: string }
  ) & {
    /** Legacy power edits remain accepted by the API. */
    isOn?: boolean
    /** Omitted attributes are preserved; null removes an attribute from the scene. */
    attributes?: SceneAttributeEdits
  }

  interface SceneDaysEdit {
    index: number
    days: string[]
  }

  interface SceneUpdateInput {
    expectedActions: Scene['actions']
    expectedTriggers: Scene['triggers']
    actions: SceneActionEdit[]
    days: SceneDaysEdit[]
  }
}

export {}
