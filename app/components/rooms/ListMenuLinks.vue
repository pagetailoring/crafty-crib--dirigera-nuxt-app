<script setup lang="ts">
import { getIkeaRoomIcon } from '@@/config/ikea-icons'

const { rooms, pending } = storeToRefs(useDirigeraCacheStore())

const items = computed(() =>
  (rooms.value?.data ?? []).map(room => ({
    label: room.name,
    icon: getIkeaRoomIcon(room.icon),
    to: `/room/${room.id}`,
  }))
)
</script>

<template>
  <div>
    <UNavigationMenu :items="items" orientation="vertical" />
    <!-- <small>{{ rooms }}</small> -->
    <small v-if="pending">Loading...</small>
  </div>
</template>
