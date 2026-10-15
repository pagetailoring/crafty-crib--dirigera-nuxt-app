<script setup lang="ts">
import { deviceAssociations } from '../services/device-associations'

const { data: devices, error } = await useFetch('/api/dirigera/devices')
const { data: scenes, error: scenesError } = await useFetch(
  '/api/dirigera/scenes'
)
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
    <DeviceFilters v-if="devices" :devices>
      <template #default="{ devices: filteredDevices }">
        <UPageColumns>
          <template v-for="device in filteredDevices" :key="device.id">
            <DeviceItemCard
              :device
              :associations="deviceAssociations(device, devices, scenes ?? [])"
              :scenes-available="scenes != null"
            />
          </template>
        </UPageColumns>
      </template>
    </DeviceFilters>
  </UContainer>
</template>
