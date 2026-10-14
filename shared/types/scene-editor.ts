import type { Scene } from 'dirigera'

export interface SceneProduct {
  id: string
  type: 'device' | 'deviceSet'
  name: string
  productName: string | null
  roomName: string | null
  canSetPower: boolean
}

export type SceneActionEdit =
  | { kind: 'existing'; index: number; isOn?: boolean }
  | {
      kind: 'new'
      type: SceneProduct['type']
      deviceId: string
      isOn: boolean
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
