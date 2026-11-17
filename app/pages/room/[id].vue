<script setup lang="ts">
import { deviceAssociations } from '~/utils/device-associations'
import { normalizeSensors } from '~/utils/normalize-sensors'

const route = useRoute()
const cache = useDirigeraCacheStore()
const { rooms } = storeToRefs(cache)
const roomId = computed(() => String(route.params.id))
const room = computed(() =>
  rooms.value?.data.find(room => room.id === roomId.value)
)
const { data: devices, error } = await useFetch('/api/dirigera/devices')
const { data: scenes, error: scenesError } = await useFetch(
  '/api/dirigera/scenes'
)
const roomsError = ref<Error | null>(null)

try {
  await cache.loadRooms()
} catch (cause) {
  roomsError.value = cause instanceof Error ? cause : new Error(String(cause))
}

const normalizedDevices = computed(() => normalizeSensors(devices.value ?? []))
const roomDevices = computed(() =>
  normalizedDevices.value.filter(device => device.room?.id === roomId.value)
)
</script>

<template>
  <UContainer>
    <h1 class="sr-only">{{ room?.name || 'Room' }}</h1>

    <UAlert
      v-if="error || roomsError"
      color="error"
      title="Unable to load the room"
      :description="(error || roomsError)?.message"
    />
    <UAlert
      v-if="devices && scenesError"
      color="warning"
      title="Unable to load scene links"
      :description="scenesError.message"
    />
    <UPageColumns v-if="devices">
      <DeviceItemCard
        v-for="device in roomDevices"
        :key="device.id"
        :device
        :associations="
          deviceAssociations(device, normalizedDevices, scenes ?? [])
        "
        :scenes-available="scenes != null"
      />
    </UPageColumns>
    <UAlert
      v-if="devices && roomDevices.length === 0"
      color="neutral"
      title="No devices"
    />

    <!-- <small>{{ room?.devices }}</small> -->
  </UContainer>
</template>
