<script setup lang="ts">
const { data: devices, error } = await useFetch('/api/dirigera/devices')
</script>

<template>
  <UContainer>
    <UAlert
      v-if="error"
      color="error"
      title="Unable to load devices"
      :description="error.message"
    />
    <DeviceFilters v-if="devices" :devices>
      <template #default="{ devices: filteredDevices }">
        <UPageColumns>
          <template v-for="device in filteredDevices" :key="device.id">
            <DeviceItemCard :device />
          </template>
        </UPageColumns>
      </template>
    </DeviceFilters>
  </UContainer>
</template>
