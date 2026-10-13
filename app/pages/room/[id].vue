<script setup lang="ts">
import type { Device } from '../../services/dirigera-client'

const route = useRoute()
const dirigera = useDirigera()
const roomId = computed(() => String(route.params.id))

const {
  data: room,
  error,
  status,
} = await useAsyncData(
  () => `room-${roomId.value}`,
  () => dirigera.getRoom(roomId.value)
)

const format = (value: number) => Math.round(value * 100) / 100

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
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <UButton to="/" color="neutral" variant="ghost">Back</UButton>
      <h1 class="text-2xl font-bold text-highlighted">
        {{ room?.name || 'Room' }}
      </h1>
    </div>

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
            <h2 class="font-semibold">{{ device.name }}</h2>
            <UBadge v-if="!device.isReachable" color="warning" variant="subtle">
              Unreachable
            </UBadge>
          </div>
        </template>

        <dl class="space-y-2 text-sm">
          <div v-for="reading in readings(device)" :key="reading">
            {{ reading }}
          </div>
        </dl>
      </UCard>

      <UCard v-if="status === 'pending'">
        <USkeleton class="h-32" />
      </UCard>
    </div>

    <UAlert
      v-if="room && room.devices.length === 0"
      color="neutral"
      title="No devices"
    />
  </div>
</template>
