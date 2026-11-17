import type { DeviceCategory } from '~/types/device-categories'

export const DEVICE_CATEGORIES: readonly DeviceCategory[] = [
  {
    type: 'light',
    label: 'Lights',
    singularLabel: 'light',
    icon: 'i-lucide-lightbulb',
    variant: 'subtle',
  },
  {
    type: 'outlet',
    label: 'Plugs',
    singularLabel: 'plug',
    icon: 'i-lucide-plug',
    variant: 'soft',
  },
  {
    type: 'controller',
    label: 'Remotes',
    singularLabel: 'remote',
    icon: 'i-lucide-toggle-left',
  },
  {
    type: 'sensor',
    label: 'Sensors',
    singularLabel: 'sensor',
    icon: 'i-lucide-radar',
  },
]
