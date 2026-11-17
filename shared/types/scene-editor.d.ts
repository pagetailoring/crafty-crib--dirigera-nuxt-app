import type { Device, Scene } from 'dirigera'

/**
 * DIRIGERA scenes group device actions with optional triggers for running them.
 */
declare global {
  /** Device settings that the scene editor can change. */
  type SceneAttribute =
    | 'isOn'
    | 'lightLevel'
    | 'colorTemperature'
    | 'colorHue'
    | 'colorSaturation'
    | 'volume'
    | 'playback'

  /** Changes to device settings within a scene action. */
  type SceneAttributeEdits = {
    [K in SceneAttribute]?: Device['attributes'][K] | null
  }

  /** A device or device set available for a scene action. */
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

  /** An edit to an existing or newly added scene action. */
  type SceneActionEdit = (
    | { kind: 'existing'; index: number }
    | { kind: 'new'; type: SceneProduct['type']; deviceId: string }
  ) & {
    /** Legacy power edits remain accepted by the API. */
    isOn?: boolean
    /** Omitted attributes are preserved; null removes an attribute from the scene. */
    attributes?: SceneAttributeEdits
  }

  /** A change to the weekdays of a scene's scheduled trigger. */
  interface SceneDaysEdit {
    index: number
    days: string[]
  }

  /** Requested scene changes and the original values used to detect conflicts. */
  interface SceneUpdateInput {
    expectedActions: Scene['actions']
    expectedTriggers: Scene['triggers']
    actions: SceneActionEdit[]
    days: SceneDaysEdit[]
  }
}

export {}
