import { describe, expect, it } from 'vitest'
import {
  getDeviceCategory,
  getDeviceCategoryFilterItems,
} from '~/utils/device-categories'

describe('Device categories', () => {
  it.each([
    ['light', 'Lights', 'light', 'i-lucide-lightbulb'],
    ['outlet', 'Plugs', 'plug', 'i-lucide-plug'],
    ['controller', 'Remotes', 'remote', 'i-lucide-toggle-left'],
    ['sensor', 'Sensors', 'sensor', 'i-lucide-radar'],
  ])(
    'resolves %s to its category label and icon',
    (type, label, singularLabel, icon) => {
      expect(getDeviceCategory(type)).toMatchObject({
        type,
        label,
        singularLabel,
        icon,
      })
    }
  )

  it.each([
    ['light', 'subtle'],
    ['outlet', 'soft'],
    ['controller', undefined],
    ['sensor', undefined],
    ['unknown', undefined],
  ] as const)('resolves the card variant for %s', (type, variant) => {
    expect(getDeviceCategory(type)?.variant).toBe(variant)
  })

  it.each(['unknown', 'lightController', 'motionSensor', ''])(
    'does not classify unsupported type %s',
    type => {
      expect(getDeviceCategory(type)).toBeUndefined()
    }
  )

  it('preserves filter order and the values understood by the store', () => {
    const items = getDeviceCategoryFilterItems()
    expect(items.map(item => item.value)).toEqual([
      'type:light',
      'type:outlet',
      'type:controller',
      'type:sensor',
    ])
    for (const item of items) {
      expect(getDeviceCategory(item.value.slice('type:'.length))).toMatchObject(
        {
          label: item.label,
          icon: item.icon,
        }
      )
    }
  })
})
