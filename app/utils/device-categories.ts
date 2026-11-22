import { DEVICE_CATEGORIES } from '../../config/device-categories'

export function getDeviceCategory(type: string) {
  return DEVICE_CATEGORIES.find(category => category.type === type)
}

export function getDeviceCategoryFilterItems() {
  return DEVICE_CATEGORIES.map(({ type, label, icon }) => ({
    label,
    value: `type:${type}`,
    icon,
  }))
}
