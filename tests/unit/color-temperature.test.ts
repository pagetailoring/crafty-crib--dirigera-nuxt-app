import { describe, expect, it } from 'vitest'
import {
  clampColorTemperature,
  getColorTemperatureRange,
} from '#shared/utils/color-temperature'

describe('Color temperature ranges', () => {
  it.each([
    [2000, 6500],
    [6500, 2000],
  ])('normalizes hub limits %s and %s', (min, max) => {
    const light = { colorTemperatureMin: min, colorTemperatureMax: max }
    expect(getColorTemperatureRange(light)).toEqual({
      min: 2000,
      max: 6500,
      reported: true,
    })
    expect(clampColorTemperature(1000, light)).toBe(2000)
    expect(clampColorTemperature(7000, light)).toBe(6500)
    expect(clampColorTemperature(3500, light)).toBe(3500)
  })
  it('uses the legacy range only for missing or invalid bounds', () => {
    expect(getColorTemperatureRange({})).toEqual({
      min: 2202,
      max: 4000,
      reported: false,
    })
    expect(
      getColorTemperatureRange({
        colorTemperatureMin: 0,
        colorTemperatureMax: 6500,
      }).reported
    ).toBe(false)
  })
})
