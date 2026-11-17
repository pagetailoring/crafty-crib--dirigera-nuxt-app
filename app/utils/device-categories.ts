import { DEVICE_CATEGORIES } from '@@/config/device-categories'

/** Find the configured display category for a device type. */
export function getDeviceCategory(type: string) {
  return DEVICE_CATEGORIES.find(category => category.type === type)
}

/** Convert configured device categories into items for the device-type filter. */
export function getDeviceCategoryFilterItems() {
  return DEVICE_CATEGORIES.map(({ type, label, icon }) => ({
    label,
    value: `type:${type}`,
    icon,
  }))
}
