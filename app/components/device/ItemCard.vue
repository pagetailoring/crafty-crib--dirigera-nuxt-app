<script setup lang="ts">
import type { Device } from 'dirigera'

const { device } = defineProps<{
  device: Device
}>()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-4">
        <span>{{ device.attributes.customName }}</span>
        <span class="ml-auto tracking-widest font-light uppercase">
          {{ device.room?.name }}
        </span>
      </div>
    </template>

    <!-- <template #title>
      <span>title</span>
    </template> -->

    <!-- <template #description>
      <span>description</span>
    </template> -->

    <template #default>
      <div class="flex gap-2 items-center justify-between">
        <UBadge
          v-if="device.attributes.lightLevel != null"
          icon="i-lucide-lightbulb"
          variant="soft"
        >
          {{ device.attributes.lightLevel }}%
        </UBadge>

        <UBadge v-if="device.attributes.isOn != null" variant="soft">
          {{ device.attributes.isOn ? 'On' : 'Off' }}
        </UBadge>

        <UBadge
          v-if="device.capabilities.canReceive.includes('colorTemperature')"
          variant="soft"
        >
          {{ device.attributes.colorTemperatureMin }}-{{
            device.attributes.colorTemperatureMax
          }}
          K
        </UBadge>

        <UBadge
          v-if="device.attributes.colorTemperature != null"
          icon="i-lucide-thermometer-sun"
        >
          {{ device.attributes.colorTemperature }} K
        </UBadge>
      </div>
    </template>

    <template #footer>
      <!-- <span>footer</span> -->
      <details>
        <summary>
          <small class="text-muted cursor-pointer"
            >Details <i>raw data</i></small
          >
        </summary>
        <small>
          <pre>{{ JSON.stringify(device, null, 2) }}</pre>
        </small>
      </details>
    </template>
  </UCard>
</template>
