<script setup lang="ts">
import type { Device } from '../services/dirigera-client'

const props = defineProps<{ device: Device }>()
const emit = defineEmits<{ changed: [] }>()
const dirigera = useDirigera()
const pending = ref(false)
const colorHue = ref(props.device.colorHue ?? 0)
const colorSaturation = ref(props.device.colorSaturation ?? 1)

async function setPower() {
  if (props.device.isOn == null) return

  pending.value = true
  try {
    await dirigera.controlDevice(props.device.id, props.device.type, {
      type: 'setIsOn',
      isOn: !props.device.isOn,
    })
    emit('changed')
  } finally {
    pending.value = false
  }
}

async function setLightLevel(event: Event) {
  const lightLevel = Number((event.target as HTMLInputElement).value)
  await dirigera.controlDevice(props.device.id, props.device.type, {
    type: 'setLightLevel',
    lightLevel,
  })
  emit('changed')
}

async function setColorTemperature(event: Event) {
  const colorTemperature = Number((event.target as HTMLInputElement).value)
  await dirigera.controlDevice(props.device.id, props.device.type, {
    type: 'setColorTemperature',
    colorTemperature,
  })
  emit('changed')
}

async function setHue(event: Event) {
  colorHue.value = Number((event.target as HTMLInputElement).value)
  await dirigera.controlDevice(props.device.id, props.device.type, {
    type: 'setColor',
    colorHue: colorHue.value,
    colorSaturation: colorSaturation.value,
  })
  emit('changed')
}

async function setSaturation(event: Event) {
  colorSaturation.value = Number((event.target as HTMLInputElement).value)
  await dirigera.controlDevice(props.device.id, props.device.type, {
    type: 'setColor',
    colorHue: colorHue.value,
    colorSaturation: colorSaturation.value,
  })
  emit('changed')
}

async function togglePlayback() {
  const playback =
    props.device.playback === 'playbackPlaying'
      ? 'playbackPaused'
      : 'playbackPlaying'
  await dirigera.controlDevice(props.device.id, props.device.type, {
    type: 'setPlayback',
    playback,
  })
  emit('changed')
}

async function setPlayback(playback: 'playbackNext' | 'playbackPrevious') {
  await dirigera.controlDevice(props.device.id, props.device.type, {
    type: 'setPlayback',
    playback,
  })
  emit('changed')
}
</script>

<template>
  <div class="space-y-4">
    <UButton
      v-if="device.isOn != null"
      :color="device.isOn ? 'primary' : 'neutral'"
      :variant="device.isOn ? 'solid' : 'outline'"
      :disabled="!device.isReachable"
      :loading="pending"
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
        :disabled="!device.isReachable"
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
        :disabled="!device.isReachable"
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
        :disabled="!device.isReachable"
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
        :disabled="!device.isReachable"
        :aria-label="`${device.name} saturation`"
        class="w-full accent-primary"
        @change="setSaturation"
      />
    </label>

    <div v-if="device.playback != null" class="flex gap-2">
      <UButton
        color="neutral"
        variant="outline"
        :disabled="!device.isReachable || !device.playbackPreviousAvailable"
        :aria-label="`Previous on ${device.name}`"
        @click="setPlayback('playbackPrevious')"
      >
        Previous
      </UButton>
      <UButton
        color="neutral"
        variant="outline"
        :disabled="!device.isReachable"
        :loading="device.playback === 'playbackBuffering'"
        :aria-label="`${device.playback === 'playbackPlaying' ? 'Pause' : 'Play'} ${device.name}`"
        @click="togglePlayback"
      >
        {{ device.playback === 'playbackPlaying' ? 'Pause' : 'Play' }}
      </UButton>
      <UButton
        color="neutral"
        variant="outline"
        :disabled="!device.isReachable || !device.playbackNextAvailable"
        :aria-label="`Next on ${device.name}`"
        @click="setPlayback('playbackNext')"
      >
        Next
      </UButton>
    </div>
  </div>
</template>
