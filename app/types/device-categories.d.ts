import type { Device } from 'dirigera'
import type { PageCardProps } from '@nuxt/ui'

export interface DeviceCategory {
  type: Device['type']
  label: string
  singularLabel: string
  icon: string
  variant?: PageCardProps['variant']
}
