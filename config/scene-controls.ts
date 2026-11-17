import { getColorTemperatureRange } from '#shared/utils/color-temperature'

export const SCENE_ATTRIBUTES = [
  'isOn',
  'lightLevel',
  'colorTemperature',
  'colorHue',
  'colorSaturation',
  'volume',
  'playback',
] as const satisfies readonly SceneAttribute[]

const fallbackTemperature = getColorTemperatureRange({})

export const SCENE_NUMERIC_CONTROLS = {
  lightLevel: { label: 'Brightness', min: 1, max: 100, step: 1, unit: '%' },
  colorTemperature: {
    label: 'Color temperature',
    min: fallbackTemperature.min,
    max: fallbackTemperature.max,
    step: 1,
    unit: ' K',
  },
  colorHue: { label: 'Hue', min: 0, max: 359, step: 1, unit: '°' },
  colorSaturation: {
    label: 'Saturation',
    min: 0,
    max: 1,
    step: 0.01,
    unit: '',
  },
  volume: { label: 'Volume', min: 0, max: 50, step: 1, unit: '%' },
} as const

export type SceneNumericAttribute = keyof typeof SCENE_NUMERIC_CONTROLS

export function sceneNumericControl(
  key: SceneNumericAttribute,
  product: SceneProduct
) {
  const control = SCENE_NUMERIC_CONTROLS[key]
  return key === 'colorTemperature'
    ? {
        ...control,
        min: product.colorTemperatureMin ?? control.min,
        max: product.colorTemperatureMax ?? control.max,
      }
    : control
}

export const SCENE_PLAYBACK_LABELS: Record<string, string> = {
  playbackPlaying: 'Play',
  playbackPaused: 'Pause',
  playbackNext: 'Next track',
  playbackPrevious: 'Previous track',
}
