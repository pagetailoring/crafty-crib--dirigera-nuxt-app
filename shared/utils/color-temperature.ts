import type { ColorTemperatureAttributes } from '#shared/types/color-temperature'

export function getColorTemperatureRange(device: ColorTemperatureAttributes) {
  const bounds = [device.colorTemperatureMin, device.colorTemperatureMax]
  if (
    bounds.every(
      value => typeof value === 'number' && Number.isFinite(value) && value > 0
    )
  ) {
    return {
      min: Math.min(...(bounds as number[])),
      max: Math.max(...(bounds as number[])),
      reported: true,
    }
  }
  // Preserve the legacy range only when the hub does not report valid limits.
  return { min: 2202, max: 4000, reported: false }
}

export function clampColorTemperature(
  value: number,
  device: ColorTemperatureAttributes
) {
  const { min, max } = getColorTemperatureRange(device)
  return Math.round(Math.min(max, Math.max(min, value)))
}
