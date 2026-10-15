<script setup lang="ts">
import { getIkeaRoomIcon } from '@@/config/ikea-icons'

const { rooms } = storeToRefs(useDirigeraCacheStore())

// lucide:gamepad-directional
// lucide:carrot
// lucide:broccoli

// lucide--component

const items = computed(() =>
  (rooms.value?.data ?? []).map(room => ({
    label: room.name,
    icon: getIkeaRoomIcon(room.icon),
    to: `/room/${room.id}`,
  }))
)
</script>

<template>
  <UNavigationMenu :items="items" orientation="vertical" />
</template>
