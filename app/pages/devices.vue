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
    <UPageColumns>
      <template v-for="device in devices" :key="device.id">
        <DeviceItemCard :device />
      </template>
    </UPageColumns>
  </UContainer>
</template>
