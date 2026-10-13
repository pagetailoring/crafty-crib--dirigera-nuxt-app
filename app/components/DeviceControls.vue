<script setup lang="ts">
import type { Device } from '../services/dirigera-client'

const props = defineProps<{ device: Device }>()
const emit = defineEmits<{ changed: [] }>()
const dirigera = useDirigera()
const pending = ref(false)

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
  </div>
</template>
