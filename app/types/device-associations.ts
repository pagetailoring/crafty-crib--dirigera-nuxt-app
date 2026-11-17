import type { Device, Scene } from 'dirigera'

export interface DeviceAssociations {
  devices: Device[]
  remotes: Device[]
  scenes: Scene[]
}
