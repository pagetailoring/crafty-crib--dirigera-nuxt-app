import type { Device, Scene } from 'dirigera'

/** Devices, remotes, and scenes associated with a selected device. */
export interface DeviceAssociations {
  devices: Device[]
  remotes: Device[]
  scenes: Scene[]
}
