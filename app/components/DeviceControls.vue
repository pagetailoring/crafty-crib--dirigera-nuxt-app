<script setup lang="ts">
import { DEVICE_CONTROL_THROTTLE_MS } from '../../config/device-controls'
import { getColorTemperatureRange } from '../../config/color-temperature'
import type { Device } from '../services/dirigera-client'

const props = defineProps<{ device: Device }>()
const temperatureRange = computed(() => getColorTemperatureRange(props.device))
const cache = useDirigeraCacheStore()
const powerPending = ref(false)
const playbackPending = ref(false)
const lightLevel = ref(props.device.lightLevel ?? 0)
const colorTemperature = ref(props.device.colorTemperature ?? 2202)
const colorHue = ref(props.device.colorHue ?? 0)
const colorSaturation = ref(props.device.colorSaturation ?? 1)
const volume = ref(props.device.volume ?? 0)

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
    if (queued === undefined) return

    const value = queued
    queued = undefined
    running = true
    active.value = true
    lastStartedAt = Date.now()
    try {
      await send(value)
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

const lightLevelControl = useThrottledControl((nextLightLevel: number) =>
  cache.controlDevice(props.device, {
    type: 'setLightLevel',
    lightLevel: nextLightLevel,
  })
)
const colorTemperatureControl = useThrottledControl(
  (nextColorTemperature: number) =>
    cache.controlDevice(props.device, {
      type: 'setColorTemperature',
      colorTemperature: nextColorTemperature,
    })
)
const colorControl = useThrottledControl(
  (color: { hue: number; saturation: number }) =>
    cache.controlDevice(props.device, {
      type: 'setColor',
      colorHue: color.hue,
      colorSaturation: color.saturation,
    })
)
const volumeControl = useThrottledControl((nextVolume: number) =>
  cache.controlDevice(props.device, {
    type: 'setVolume',
    volume: nextVolume,
  })
)

watch(
  () =>
    [
      props.device.lightLevel,
      props.device.colorTemperature,
      props.device.colorHue,
      props.device.colorSaturation,
      props.device.volume,
    ] as const,
  ([
    nextLightLevel,
    nextColorTemperature,
    nextHue,
    nextSaturation,
    nextVolume,
  ]) => {
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
    if (!volumeControl.active.value && nextVolume != null) {
      volume.value = nextVolume
    }
  }
)

if (props.device.playItem != null && props.device.type === 'DEVICE') {
  await cache.loadPlayItemImage(props.device.id)
}

watch(
  () => props.device.playItem,
  (playItem, previousPlayItem) => {
    if (
      playItem != null &&
      playItem !== previousPlayItem &&
      props.device.type === 'DEVICE'
    ) {
      void cache
        .loadPlayItemImage(props.device.id, { force: true })
        .catch(error =>
          console.error('Unable to refresh play item image', error)
        )
    }
  }
)

const playItemImage = computed(
  () => cache.playItemImageByDeviceId[props.device.id]?.data ?? null
)

async function setPower(isOn: boolean) {
  powerPending.value = true
  try {
    await cache.controlDevice(props.device, {
      type: 'setIsOn',
      isOn,
    })
  } finally {
    powerPending.value = false
  }
}

function setLightLevel(value: number | undefined) {
  if (value === undefined) return
  lightLevel.value = value
  lightLevelControl.update(value)
}

function setColorTemperature(value: number | undefined) {
  if (value === undefined) return
  colorTemperature.value = value
  colorTemperatureControl.update(value)
}

function setHue(value: number | undefined) {
  if (value === undefined) return
  colorHue.value = value
  colorControl.update({ hue: value, saturation: colorSaturation.value })
}

function setSaturation(value: number | undefined) {
  if (value === undefined) return
  colorSaturation.value = value
  colorControl.update({ hue: colorHue.value, saturation: value })
}

async function togglePlayback() {
  const playback =
    props.device.playback === 'playbackPaused'
      ? 'playbackPlaying'
      : 'playbackPaused'
  playbackPending.value = true
  try {
    await cache.controlDevice(props.device, {
      type: 'setPlayback',
      playback,
    })
  } finally {
    playbackPending.value = false
  }
}

async function setPlayback(playback: 'playbackNext' | 'playbackPrevious') {
  playbackPending.value = true
  try {
    await cache.controlDevice(props.device, {
      type: 'setPlayback',
      playback,
    })
  } finally {
    playbackPending.value = false
  }
}

function setVolume(value: number | undefined) {
  if (value === undefined) return
  volume.value = value
  volumeControl.update(value)
}
</script>

<template>
  <div class="space-y-4">
    <USwitch
      v-if="device.isOn != null"
      :model-value="device.isOn"
      :label="device.isOn ? 'On' : 'Off'"
      :disabled="!device.isReachable"
      :loading="powerPending"
      :aria-label="`Turn ${device.name} ${device.isOn ? 'off' : 'on'}`"
      @update:model-value="setPower"
    />

    <label v-if="device.lightLevel != null" class="block space-y-1 text-sm">
      <span>Light level {{ lightLevel }}%</span>
      <USlider
        :min="1"
        :max="100"
        :model-value="lightLevel"
        :disabled="!device.isReachable"
        :aria-label="`${device.name} light level`"
        @update:model-value="setLightLevel"
      />
    </label>

    <label
      v-if="device.colorTemperature != null"
      class="block space-y-1 text-sm"
    >
      <span>Color temperature {{ colorTemperature }} K</span>
      <USlider
        :min="temperatureRange.min"
        :max="temperatureRange.max"
        :model-value="colorTemperature"
        :disabled="!device.isReachable"
        :aria-label="`${device.name} color temperature`"
        @update:model-value="setColorTemperature"
      />
    </label>

    <label v-if="device.colorHue != null" class="block space-y-1 text-sm">
      <span>Hue {{ colorHue }}°</span>
      <USlider
        :min="0"
        :max="359"
        :model-value="colorHue"
        :disabled="!device.isReachable"
        :aria-label="`${device.name} hue`"
        @update:model-value="setHue"
      />
    </label>

    <label
      v-if="device.colorSaturation != null"
      class="block space-y-1 text-sm"
    >
      <span>Saturation {{ Math.round(colorSaturation * 100) }}%</span>
      <USlider
        :min="0"
        :max="1"
        :step="0.01"
        :model-value="colorSaturation"
        :disabled="!device.isReachable"
        :aria-label="`${device.name} saturation`"
        @update:model-value="setSaturation"
      />
    </label>

    <div v-if="device.playback != null" class="flex gap-2">
      <UButton
        :disabled="
          !device.isReachable ||
          playbackPending ||
          !device.playbackPreviousAvailable
        "
        :aria-label="`Previous on ${device.name}`"
        @click="setPlayback('playbackPrevious')"
      >
        Previous
      </UButton>
      <UButton
        :disabled="!device.isReachable || playbackPending"
        :aria-label="`${device.playback === 'playbackPaused' ? 'Play' : 'Pause'} ${device.name}`"
        @click="togglePlayback"
      >
        <UIcon
          v-if="device.playback === 'playbackBuffering'"
          name="i-lucide-loader-circle"
          class="animate-spin"
          aria-hidden="true"
        />
        {{ device.playback === 'playbackPaused' ? 'Play' : 'Pause' }}
      </UButton>
      <UButton
        :disabled="
          !device.isReachable ||
          playbackPending ||
          !device.playbackNextAvailable
        "
        :aria-label="`Next on ${device.name}`"
        @click="setPlayback('playbackNext')"
      >
        Next
      </UButton>
    </div>

    <label v-if="device.volume != null" class="block space-y-1 text-sm">
      <span>Volume {{ volume }}%</span>
      <USlider
        :min="0"
        :max="50"
        :model-value="volume"
        :disabled="!device.isReachable"
        :aria-label="`${device.name} volume`"
        @update:model-value="setVolume"
      />
    </label>

    <p v-if="device.playItem" class="text-sm">
      Now playing: {{ device.playItem }}
    </p>
    <p v-if="device.nextPlayItem" class="text-sm">
      Next: {{ device.nextPlayItem }}
    </p>
    <img
      v-if="playItemImage"
      :src="playItemImage"
      :alt="`Artwork for ${device.playItem}`"
      class="w-full rounded-md"
    />
  </div>
</template>
