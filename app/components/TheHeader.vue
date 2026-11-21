<script setup lang="ts">
import { APP_NAME } from '../../config/app'

const route = useRoute()
const cache = useDirigeraCacheStore()
const { roomById } = storeToRefs(cache)

const activeRoomName = computed(() => {
  if (route.name !== 'room-id') return null
  return roomById.value[String(route.params.id)]?.data.name ?? 'Room'
})
</script>

<template>
  <UHeader mode="drawer">
    <template #left>
      <ULink
        to="/"
        :aria-label="APP_NAME"
        class="flex shrink-0 items-end gap-1.5 text-xl font-bold text-highlighted"
      >
        {{ APP_NAME }}
      </ULink>

      <template v-if="activeRoomName">
        <UButton to="/" color="neutral" variant="ghost">Back</UButton>
        <span class="text-xl font-bold text-highlighted">
          {{ activeRoomName }}
        </span>
      </template>
    </template>
  </UHeader>
</template>
