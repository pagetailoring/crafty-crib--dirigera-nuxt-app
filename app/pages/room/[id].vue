<script setup lang="ts">
import type { Device } from '../../services/dirigera-client'

const route = useRoute()
const cache = useDirigeraCacheStore()
const { roomById, pending } = storeToRefs(cache)
const roomId = computed(() => String(route.params.id))
const room = computed(() => roomById.value[roomId.value]?.data ?? null)
const error = ref<Error | null>(null)

try {
  await cache.loadRoom(roomId.value)
} catch (cause) {
  error.value = cause instanceof Error ? cause : new Error(String(cause))
}

const format = (value: number) => Math.round(value * 100) / 100
const formatDeviceType = (value: string) =>
  value.replaceAll(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()

const readings = (device: Device) =>
  [
    device.batteryPercentage == null
      ? null
      : `Battery ${device.batteryPercentage}%`,
    device.isOpen == null ? null : device.isOpen ? 'Open' : 'Closed',
    device.temperature == null
      ? null
      : `Temperature ${format(device.temperature)}°C`,
    device.humidity == null ? null : `Humidity ${format(device.humidity)}%`,
    device.pm25 == null ? null : `PM2.5 ${device.pm25} μg/m³`,
    device.vocIndex == null ? null : `VOC index ${device.vocIndex}`,
    device.co2 == null ? null : `CO2 ${device.co2} ppm`,
    device.isDetected == null
      ? null
      : `Motion detected ${device.isDetected ? 'yes' : 'no'}`,
    device.illuminance == null ? null : `Illuminance ${device.illuminance} lx`,
  ].filter((reading): reading is string => reading !== null)
</script>

<template>
  <UContainer>
    <h1 class="sr-only">{{ room?.name || 'Room' }}</h1>

    <UAlert
      v-if="error"
      color="error"
      title="Unable to load the room"
      :description="error.message"
    />

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <UCard v-for="device in room?.devices" :key="device.id">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="font-semibold">{{ device.name }}</h2>
              <p
                v-if="device.deviceType || device.productName"
                class="text-sm text-muted"
              >
                <span v-if="device.deviceType">
                  {{ formatDeviceType(device.deviceType) }}
                </span>
                <span v-if="device.deviceType && device.productName">
                  &middot;
                </span>
                <span v-if="device.productName">{{ device.productName }}</span>
              </p>
            </div>
            <UBadge v-if="!device.isReachable" color="warning">
              Unreachable. Last seen
              {{ new Date(device.lastSeen).toLocaleString() }}
            </UBadge>
          </div>
        </template>

        <DeviceControls :device="device" class="mb-4" />

        <dl class="space-y-2 text-sm">
          <div v-for="reading in readings(device)" :key="reading">
            {{ reading }}
          </div>
        </dl>
      </UCard>

      <UCard v-if="pending[`room:${roomId}`]">
        <USkeleton class="h-32" />
      </UCard>
    </div>

    <UAlert
      v-if="room && room.devices.length === 0"
      color="neutral"
      title="No devices"
    />

    <!-- <small>{{ room?.devices }}</small> -->
  </UContainer>
</template>
