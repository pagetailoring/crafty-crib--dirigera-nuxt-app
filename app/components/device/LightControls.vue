<script setup lang="ts">
import type { Device } from 'dirigera'
import { getColorTemperatureRange } from '#shared/utils/color-temperature'
import { DEVICE_CONTROL_THROTTLE_MS } from '@@/config/device-controls'

const props = defineProps<{ device: Device; disabled?: boolean }>()
const controlsDisabled = computed(
  () => props.disabled || !props.device.isReachable
)
const dirigera = useDirigera()
const cache = useDirigeraCacheStore()
const lightLevel = ref(props.device.attributes.lightLevel ?? 0)
const colorTemperature = ref(props.device.attributes.colorTemperature ?? 2202)
const colorHue = ref(props.device.attributes.colorHue ?? 0)
const colorSaturation = ref(props.device.attributes.colorSaturation ?? 1)
const temperatureRange = computed(() =>
  getColorTemperatureRange(props.device.attributes)
)

function useThrottledControl<T>(send: (value: T) => Promise<void>) {
  const active = ref(false)
  let queued: T | undefined
  let running = false
  let lastStartedAt = Number.NEGATIVE_INFINITY
  let timer: ReturnType<typeof setTimeout> | undefined

  function schedule() {
    if (running || timer || queued === undefined) return

    const delay = Math.max(
      0,
      DEVICE_CONTROL_THROTTLE_MS - (Date.now() - lastStartedAt)
    )
    if (delay === 0) {
      void run()
      return
    }

    timer = setTimeout(() => {
      timer = undefined
      void run()
    }, delay)
  }

  async function run() {
    if (controlsDisabled.value) {
      queued = undefined
      active.value = false
      return
    }
    if (queued === undefined) return

    const value = queued
    queued = undefined
    running = true
    active.value = true
    lastStartedAt = Date.now()
    try {
      await send(value)
      cache.invalidateAll()
      void refreshNuxtData('/api/dirigera/devices').catch(error =>
        console.error('Unable to refresh devices', error)
      )
    } catch (error) {
      console.error('Unable to update device control', error)
    } finally {
      running = false
      if (queued === undefined) active.value = false
      else schedule()
    }
  }

  function update(value: T) {
    queued = value
    active.value = true
    schedule()
  }

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
  })

  return { active, update }
}

const lightLevelControl = useThrottledControl((value: number) =>
  dirigera.controlDevice(props.device.id, 'DEVICE', {
    type: 'setLightLevel',
    lightLevel: value,
  })
)
const colorTemperatureControl = useThrottledControl((value: number) =>
  dirigera.controlDevice(props.device.id, 'DEVICE', {
    type: 'setColorTemperature',
    colorTemperature: value,
  })
)
const colorControl = useThrottledControl(
  (value: { hue: number; saturation: number }) =>
    dirigera.controlDevice(props.device.id, 'DEVICE', {
      type: 'setColor',
      colorHue: value.hue,
      colorSaturation: value.saturation,
    })
)

watch(
  () =>
    [
      props.device.attributes.lightLevel,
      props.device.attributes.colorTemperature,
      props.device.attributes.colorHue,
      props.device.attributes.colorSaturation,
    ] as const,
  ([nextLightLevel, nextColorTemperature, nextHue, nextSaturation]) => {
    if (!lightLevelControl.active.value && nextLightLevel != null) {
      lightLevel.value = nextLightLevel
    }
    if (!colorTemperatureControl.active.value && nextColorTemperature != null) {
      colorTemperature.value = nextColorTemperature
    }
    if (!colorControl.active.value) {
      if (nextHue != null) colorHue.value = nextHue
      if (nextSaturation != null) colorSaturation.value = nextSaturation
    }
  }
)

function setLightLevel(value: number | undefined) {
  if (value === undefined || controlsDisabled.value) return
  lightLevel.value = value
  lightLevelControl.update(value)
}

function setColorTemperature(value: number | undefined) {
  if (value === undefined || controlsDisabled.value) return
  colorTemperature.value = value
  colorTemperatureControl.update(value)
}

function setHue(value: number | undefined) {
  if (value === undefined || controlsDisabled.value) return
  colorHue.value = value
  colorControl.update({ hue: value, saturation: colorSaturation.value })
}

function setSaturation(value: number | undefined) {
  if (value === undefined || controlsDisabled.value) return
  colorSaturation.value = value
  colorControl.update({ hue: colorHue.value, saturation: value })
}
</script>

<template>
  <div class="pl-6 pb-2 w-full grid gap-4 text-sm">
    <div v-if="device.capabilities.canReceive.includes('lightLevel')">
      <p class="mb-1">Light level {{ lightLevel }}%</p>
      <USlider
        :min="1"
        :max="100"
        :model-value="lightLevel"
        :color="controlsDisabled ? 'secondary' : 'primary'"
        :disabled="controlsDisabled"
        :aria-label="`${device.attributes.customName} light level`"
        @update:model-value="setLightLevel"
      />
    </div>

    <div v-if="device.capabilities.canReceive.includes('colorTemperature')">
      <p class="mb-1">Color temperature {{ colorTemperature }} K</p>
      <USlider
        :min="temperatureRange.min"
        :max="temperatureRange.max"
        :model-value="colorTemperature"
        :color="controlsDisabled ? 'secondary' : 'primary'"
        :disabled="controlsDisabled"
        :aria-label="`${device.attributes.customName} color temperature`"
        @update:model-value="setColorTemperature"
      />
    </div>

    <div v-if="device.capabilities.canReceive.includes('colorHue')">
      <p class="mb-1">Hue {{ colorHue }}°</p>
      <USlider
        :min="0"
        :max="359"
        :model-value="colorHue"
        :color="controlsDisabled ? 'secondary' : 'primary'"
        :disabled="controlsDisabled"
        :aria-label="`${device.attributes.customName} hue`"
        @update:model-value="setHue"
      />
    </div>

    <div v-if="device.capabilities.canReceive.includes('colorSaturation')">
      <p class="mb-1">Saturation {{ Math.round(colorSaturation * 100) }}%</p>
      <USlider
        :min="0"
        :max="1"
        :step="0.01"
        :model-value="colorSaturation"
        :color="controlsDisabled ? 'secondary' : 'primary'"
        :disabled="controlsDisabled"
        :aria-label="`${device.attributes.customName} saturation`"
        @update:model-value="setSaturation"
      />
    </div>
  </div>
</template>
