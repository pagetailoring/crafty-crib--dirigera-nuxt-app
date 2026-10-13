<script setup lang="ts">
import type { Device } from '../services/dirigera-client'

const props = defineProps<{ device: Device }>()
const cache = useDirigeraCacheStore()
const powerPending = ref(false)
const lightLevelPending = ref(false)
const colorTemperaturePending = ref(false)
const colorPending = ref(false)
const playbackPending = ref(false)
const volumePending = ref(false)
const colorHue = ref(props.device.colorHue ?? 0)
const colorSaturation = ref(props.device.colorSaturation ?? 1)

watch(
  () => [props.device.colorHue, props.device.colorSaturation] as const,
  ([hue, saturation]) => {
    colorHue.value = hue ?? 0
    colorSaturation.value = saturation ?? 1
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

async function setPower() {
  if (props.device.isOn == null) return

  powerPending.value = true
  try {
    await cache.controlDevice(props.device, {
      type: 'setIsOn',
      isOn: !props.device.isOn,
    })
  } finally {
    powerPending.value = false
  }
}

async function setLightLevel(event: Event) {
  const lightLevel = Number((event.target as HTMLInputElement).value)
  lightLevelPending.value = true
  try {
    await cache.controlDevice(props.device, {
      type: 'setLightLevel',
      lightLevel,
    })
  } finally {
    lightLevelPending.value = false
  }
}

async function setColorTemperature(event: Event) {
  const colorTemperature = Number((event.target as HTMLInputElement).value)
  colorTemperaturePending.value = true
  try {
    await cache.controlDevice(props.device, {
      type: 'setColorTemperature',
      colorTemperature,
    })
  } finally {
    colorTemperaturePending.value = false
  }
}

async function setHue(event: Event) {
  colorHue.value = Number((event.target as HTMLInputElement).value)
  colorPending.value = true
  try {
    await cache.controlDevice(props.device, {
      type: 'setColor',
      colorHue: colorHue.value,
      colorSaturation: colorSaturation.value,
    })
  } finally {
    colorPending.value = false
  }
}

async function setSaturation(event: Event) {
  colorSaturation.value = Number((event.target as HTMLInputElement).value)
  colorPending.value = true
  try {
    await cache.controlDevice(props.device, {
      type: 'setColor',
      colorHue: colorHue.value,
      colorSaturation: colorSaturation.value,
    })
  } finally {
    colorPending.value = false
  }
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

async function setVolume(event: Event) {
  const volume = Number((event.target as HTMLInputElement).value)
  volumePending.value = true
  try {
    await cache.controlDevice(props.device, {
      type: 'setVolume',
      volume,
    })
  } finally {
    volumePending.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <UButton
      v-if="device.isOn != null"
      :color="device.isOn ? 'primary' : 'neutral'"
      :variant="device.isOn ? 'solid' : 'outline'"
      :disabled="!device.isReachable"
      :loading="powerPending"
      :aria-label="`Turn ${device.name} ${device.isOn ? 'off' : 'on'}`"
      @click="setPower"
    >
      {{ device.isOn ? 'On' : 'Off' }}
    </UButton>

    <label v-if="device.lightLevel != null" class="block space-y-1 text-sm">
      <span>Light level {{ device.lightLevel }}%</span>
      <input
        type="range"
        min="1"
        max="100"
        :value="device.lightLevel"
        :disabled="!device.isReachable || lightLevelPending"
        :aria-label="`${device.name} light level`"
        class="w-full accent-primary"
        @change="setLightLevel"
      />
    </label>

    <label
      v-if="device.colorTemperature != null"
      class="block space-y-1 text-sm"
    >
      <span>Color temperature {{ device.colorTemperature }} K</span>
      <input
        type="range"
        min="2202"
        max="4000"
        :value="device.colorTemperature"
        :disabled="!device.isReachable || colorTemperaturePending"
        :aria-label="`${device.name} color temperature`"
        class="w-full accent-primary"
        @change="setColorTemperature"
      />
    </label>

    <label v-if="device.colorHue != null" class="block space-y-1 text-sm">
      <span>Hue {{ device.colorHue }}°</span>
      <input
        type="range"
        min="0"
        max="359"
        :value="device.colorHue"
        :disabled="!device.isReachable || colorPending"
        :aria-label="`${device.name} hue`"
        class="w-full accent-primary"
        @change="setHue"
      />
    </label>

    <label
      v-if="device.colorSaturation != null"
      class="block space-y-1 text-sm"
    >
      <span>Saturation {{ Math.round(device.colorSaturation * 100) }}%</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        :value="device.colorSaturation"
        :disabled="!device.isReachable || colorPending"
        :aria-label="`${device.name} saturation`"
        class="w-full accent-primary"
        @change="setSaturation"
      />
    </label>

    <div v-if="device.playback != null" class="flex gap-2">
      <UButton
        color="neutral"
        variant="outline"
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
        color="neutral"
        variant="outline"
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
        color="neutral"
        variant="outline"
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
      <span>Volume {{ device.volume }}%</span>
      <input
        type="range"
        min="0"
        max="50"
        :value="device.volume"
        :disabled="!device.isReachable || volumePending"
        :aria-label="`${device.name} volume`"
        class="w-full accent-primary"
        @change="setVolume"
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
