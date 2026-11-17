import type { SwitchProps } from '@nuxt/ui'

export interface DeviceSwitchProps<T = boolean> extends SwitchProps<T> {
  /**
   * Custom icon variants for switching devices on and off:
   * - `light`: lights.
   * - `power`: other electrical devices.
   * Omitting the mode preserves the default Nuxt UI switch behavior.
   */
  mode?: 'power' | 'light'
}
