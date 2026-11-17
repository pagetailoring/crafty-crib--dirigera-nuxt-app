<script setup lang="ts">
import { deviceAssociations } from '~/utils/device-associations'
import { normalizeSensors } from '~/utils/normalize-sensors'

const { data: devices, error } = await useFetch('/api/dirigera/devices')
const { data: scenes, error: scenesError } = await useFetch(
  '/api/dirigera/scenes'
)
const filters = useDeviceFiltersStore()
const { filteredDevices, hasActiveFilters } = storeToRefs(filters)
const normalizedDevices = computed(() => normalizeSensors(devices.value ?? []))

watch(
  normalizedDevices,
  value => {
    filters.devices = value ?? null
  },
  { immediate: true }
)

onUnmounted(() => {
  filters.devices = null
})
</script>

<template>
  <UContainer>
    <UAlert
      v-if="error"
      color="error"
      title="Unable to load devices"
      :description="error.message"
    />
    <UAlert
      v-if="devices && scenesError"
      color="warning"
      title="Unable to load scene links"
      :description="scenesError.message"
    />
    <UPageColumns v-if="devices">
      <template v-for="device in filteredDevices" :key="device.id">
        <DeviceItemCard
          :device
          :associations="
            deviceAssociations(device, normalizedDevices, scenes ?? [])
          "
          :scenes-available="scenes != null"
        />
      </template>
    </UPageColumns>
    <UAlert
      v-if="devices && hasActiveFilters && filteredDevices.length === 0"
      color="neutral"
      title="No devices match the selected filters"
    />
  </UContainer>
</template>
